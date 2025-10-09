using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Text.Json;
using AlgorithmBattleArina.Controllers;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Helpers;

namespace AlgorithmBattleArena.Tests;

public class AdminControllerTests : IDisposable
{
    private readonly DataContextEF _context;
    private readonly AdminController _controller;
    private readonly ILogger<AdminController> _logger;

    public AdminControllerTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=localhost;Database=TestDB;Trusted_Connection=True;"
            })
            .Build();

        var options = new DbContextOptionsBuilder<DataContextEF>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new TestDataContextEF(config, options);
        _logger = new TestLogger<AdminController>();
        _controller = new AdminController(_context, _logger);

        // Set up admin claims
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "admin@example.com"),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.NameIdentifier, "1")
        }, "TestAuth");

        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(identity)
        };
        httpContext.Items["CorrelationId"] = "test-correlation-id";

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task ToggleUserActive_DeactivateStudent_CreatesAuditLog()
    {
        // Arrange - Seed a student with IsActive=true
        var auth = new Auth
        {
            Email = "student@example.com",
            PasswordHash = new byte[] { 1, 2, 3 },
            PasswordSalt = new byte[] { 4, 5, 6 }
        };

        var student = new Student
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "student@example.com",
            Active = true
        };

        _context.Auth.Add(auth);
        _context.Student.Add(student);
        await _context.SaveChangesAsync();

        var studentId = student.StudentId;
        var prefixedId = $"Student:{studentId}";

        // Act - Call AdminController PUT /users/{id}/deactivate
        var request = new UserToggleDto { Deactivate = true };
        var result = await _controller.ToggleUserActive(prefixedId, request);

        // Assert - User IsActive changed to false
        var updatedStudent = await _context.Student.FindAsync(studentId);
        Assert.NotNull(updatedStudent);
        Assert.False(updatedStudent.Active);

        // Assert - AuditLog contains correct entry
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.Equal("UserDeactivated", auditLog.Action);
        Assert.Equal("User", auditLog.ResourceType);
        Assert.Equal(prefixedId, auditLog.ResourceId);
        Assert.Equal("Admin:1", auditLog.ActorUserId);
        Assert.Equal("admin@example.com", auditLog.ActorEmail);
        Assert.Equal("test-correlation-id", auditLog.CorrelationId);

        // Assert - Details contains before/after state
        var details = JsonSerializer.Deserialize<JsonElement>(auditLog.Details);
        var beforeState = details.GetProperty("before").GetProperty("isActive").GetBoolean();
        var afterState = details.GetProperty("after").GetProperty("isActive").GetBoolean();
        Assert.True(beforeState);
        Assert.False(afterState);

        // Assert - Controller returns updated user
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedUser = Assert.IsType<AdminUserDto>(okResult.Value);
        Assert.Equal(prefixedId, returnedUser.Id);
        Assert.False(returnedUser.IsActive);
        Assert.Equal("Student", returnedUser.Role);
    }

    [Fact]
    public async Task ToggleUserActive_ReactivateTeacher_CreatesAuditLog()
    {
        // Arrange - Seed a teacher with IsActive=false
        var auth = new Auth
        {
            Email = "teacher@example.com",
            PasswordHash = new byte[] { 1, 2, 3 },
            PasswordSalt = new byte[] { 4, 5, 6 }
        };

        var teacher = new Teacher
        {
            FirstName = "Jane",
            LastName = "Smith",
            Email = "teacher@example.com",
            Active = false
        };

        _context.Auth.Add(auth);
        _context.Teachers.Add(teacher);
        await _context.SaveChangesAsync();

        var teacherId = teacher.TeacherId;
        var prefixedId = $"Teacher:{teacherId}";

        // Act - Call AdminController PUT /users/{id}/deactivate with deactivate=false (reactivate)
        var request = new UserToggleDto { Deactivate = false };
        var result = await _controller.ToggleUserActive(prefixedId, request);

        // Assert - User IsActive changed to true
        var updatedTeacher = await _context.Teachers.FindAsync(teacherId);
        Assert.NotNull(updatedTeacher);
        Assert.True(updatedTeacher.Active);

        // Assert - AuditLog contains correct entry
        var auditLog = await _context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(auditLog);
        Assert.Equal("UserReactivated", auditLog.Action);
        Assert.Equal("User", auditLog.ResourceType);
        Assert.Equal(prefixedId, auditLog.ResourceId);

        // Assert - Details contains before/after state
        var details = JsonSerializer.Deserialize<JsonElement>(auditLog.Details);
        var beforeState = details.GetProperty("before").GetProperty("isActive").GetBoolean();
        var afterState = details.GetProperty("after").GetProperty("isActive").GetBoolean();
        Assert.False(beforeState);
        Assert.True(afterState);
    }

    [Fact]
    public async Task GetUsers_ReturnsPagedResults()
    {
        // Arrange - Seed multiple users
        var studentAuth = new Auth
        {
            Email = "student@example.com",
            PasswordHash = new byte[] { 1, 2, 3 },
            PasswordSalt = new byte[] { 4, 5, 6 }
        };

        var teacherAuth = new Auth
        {
            Email = "teacher@example.com",
            PasswordHash = new byte[] { 7, 8, 9 },
            PasswordSalt = new byte[] { 10, 11, 12 }
        };

        var student = new Student
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "student@example.com",
            Active = true
        };

        var teacher = new Teacher
        {
            FirstName = "Jane",
            LastName = "Smith",
            Email = "teacher@example.com",
            Active = true
        };

        _context.Auth.AddRange(studentAuth, teacherAuth);
        _context.Student.Add(student);
        _context.Teachers.Add(teacher);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GetUsers(null, null, 1, 25);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var pagedResult = Assert.IsType<PagedResult<AdminUserDto>>(okResult.Value);
        Assert.Equal(2, pagedResult.Total);
        Assert.Equal(2, pagedResult.Items.Count());

        var users = pagedResult.Items.ToList();
        Assert.Contains(users, u => u.Role == "Student" && u.Name == "John Doe");
        Assert.Contains(users, u => u.Role == "Teacher" && u.Name == "Jane Smith");
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private class TestDataContextEF : DataContextEF
    {
        private readonly DbContextOptions<DataContextEF> _options;

        public TestDataContextEF(IConfiguration config, DbContextOptions<DataContextEF> options) 
            : base(config)
        {
            _options = options;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString());
        }
    }

    private class TestLogger<T> : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => false;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
    }
}