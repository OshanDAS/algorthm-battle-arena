using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Security.Claims;
using AlgorithmBattleArina.Controllers;
using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Helpers;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Models;

namespace AlgorithmBattleArena.Tests;

public class AuthControllerTests : IDisposable
{
    private readonly List<string> _envVarsToCleanup = new();

    private void SetEnvironmentVariable(string key, string value)
    {
        Environment.SetEnvironmentVariable(key, value);
        _envVarsToCleanup.Add(key);
    }

    public void Dispose()
    {
        foreach (var key in _envVarsToCleanup)
        {
            Environment.SetEnvironmentVariable(key, null);
        }
    }

    private static AuthHelper CreateAuthHelper()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string,string?>
            {
                ["AppSettings:PasswordKey"] = "test-password-key",
                ["AppSettings:TokenKey"] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#"
            })
            .Build();
        return new AuthHelper(config);
    }

    [Fact]
    public void RegisterStudent_PasswordMismatch_ReturnsBadRequest()
    {
        var repo = new Mock<IAuthRepository>();
        var controller = new AuthController(repo.Object, CreateAuthHelper());
        var dto = new StudentForRegistrationDto { Email="e@e.com", Password="a", PasswordConfirm="b" };

        var result = controller.RegisterStudent(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Passwords do not match", bad.Value);
    }

    [Fact]
    public void RegisterStudent_UserExists_ReturnsBadRequest()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.UserExists("e@e.com")).Returns(true);
        var controller = new AuthController(repo.Object, CreateAuthHelper());
        var dto = new StudentForRegistrationDto { Email="e@e.com", Password="x", PasswordConfirm="x" };

        var result = controller.RegisterStudent(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("User with this email already exists", bad.Value);
    }

    [Fact]
    public void RegisterStudent_Success_ReturnsOk()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.UserExists("e@e.com")).Returns(false);
        repo.Setup(r => r.RegisterStudent(It.IsAny<StudentForRegistrationDto>())).Returns(true);
        var controller = new AuthController(repo.Object, CreateAuthHelper());
        var dto = new StudentForRegistrationDto { Email="e@e.com", Password="x", PasswordConfirm="x" };

        var result = controller.RegisterStudent(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Contains("Student registered successfully", ok.Value!.ToString());
    }

    [Fact]
    public void RegisterStudent_RepositoryFailure_ReturnsBadRequest()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.UserExists("e@e.com")).Returns(false);
        repo.Setup(r => r.RegisterStudent(It.IsAny<StudentForRegistrationDto>())).Returns(false);
        var controller = new AuthController(repo.Object, CreateAuthHelper());
        var dto = new StudentForRegistrationDto { Email="e@e.com", Password="x", PasswordConfirm="x" };

        var result = controller.RegisterStudent(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Failed to register student", bad.Value);
    }

    [Fact]
    public void RegisterTeacher_UserExists_ReturnsBadRequest()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.UserExists("t@e.com")).Returns(true);
        var controller = new AuthController(repo.Object, CreateAuthHelper());
        var dto = new TeacherForRegistrationDto { Email="t@e.com", Password="x", PasswordConfirm="x" };

        var result = controller.RegisterTeacher(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("User with this email already exists", bad.Value);
    }

    [Fact]
    public void RegisterTeacher_Success_ReturnsOk()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.UserExists("t@e.com")).Returns(false);
        repo.Setup(r => r.RegisterTeacher(It.IsAny<TeacherForRegistrationDto>())).Returns(true);
        var controller = new AuthController(repo.Object, CreateAuthHelper());
        var dto = new TeacherForRegistrationDto { Email="t@e.com", Password="x", PasswordConfirm="x" };

        var result = controller.RegisterTeacher(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Contains("Teacher registered successfully", ok.Value!.ToString());
    }

    [Fact]
    public void RegisterTeacher_RepositoryFailure_ReturnsBadRequest()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.UserExists("t@e.com")).Returns(false);
        repo.Setup(r => r.RegisterTeacher(It.IsAny<TeacherForRegistrationDto>())).Returns(false);
        var controller = new AuthController(repo.Object, CreateAuthHelper());
        var dto = new TeacherForRegistrationDto { Email="t@e.com", Password="x", PasswordConfirm="x" };

        var result = controller.RegisterTeacher(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Failed to register teacher", bad.Value);
    }

    [Fact]
    public void Login_InvalidCredentials_ReturnsUnauthorized()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetAuthByEmail("e@e.com")).Returns((Auth?)null);
        var controller = new AuthController(repo.Object, CreateAuthHelper());

        var result = controller.Login(new UserForLoginDto { Email="e@e.com", Password="x" });

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public void Login_ValidCredentials_ReturnsToken()
    {
        // Clear any environment variables that might interfere
        SetEnvironmentVariable("PASSWORD_KEY", null!);
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var helper = CreateAuthHelper();
        var salt = helper.GetPasswordSalt();
        var hash = helper.GetPasswordHash("P@ssw0rd", salt);

        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetAuthByEmail("e@e.com")).Returns(new Auth {
            Email="e@e.com", PasswordSalt=salt, PasswordHash=hash
        });
        repo.Setup(r => r.GetUserRole("e@e.com")).Returns("Student");
        repo.Setup(r => r.GetStudentByEmail("e@e.com")).Returns(new Student { StudentId=1, Email="e@e.com", FirstName="A", LastName="B", Active=true });

        var controller = new AuthController(repo.Object, helper);

        var result = controller.Login(new UserForLoginDto { Email="e@e.com", Password="P@ssw0rd" });

        var ok = Assert.IsType<OkObjectResult>(result);
        var val = ok.Value!;
        string token = (string)val.GetType().GetProperty("token")!.GetValue(val)!;
        string role = (string)val.GetType().GetProperty("role")!.GetValue(val)!;
        string email = (string)val.GetType().GetProperty("email")!.GetValue(val)!;
        Assert.False(string.IsNullOrWhiteSpace(token));
        Assert.Equal("Student", role);
        Assert.Equal("e@e.com", email);
    }

    [Fact]
    public void Login_UnknownRole_ReturnsUnauthorized()
    {
        SetEnvironmentVariable("PASSWORD_KEY", null!);
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var helper = CreateAuthHelper();
        var salt = helper.GetPasswordSalt();
        var hash = helper.GetPasswordHash("P@ssw0rd", salt);
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetAuthByEmail("e@e.com")).Returns(new Auth { Email="e@e.com", PasswordSalt=salt, PasswordHash=hash });
        repo.Setup(r => r.GetUserRole("e@e.com")).Returns("Unknown");

        var controller = new AuthController(repo.Object, helper);
        var result = controller.Login(new UserForLoginDto { Email="e@e.com", Password="P@ssw0rd" });

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public void Login_ProfileMissing_ReturnsUnauthorized()
    {
        SetEnvironmentVariable("PASSWORD_KEY", null!);
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var helper = CreateAuthHelper();
        var salt = helper.GetPasswordSalt();
        var hash = helper.GetPasswordHash("P@ssw0rd", salt);
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetAuthByEmail("e@e.com")).Returns(new Auth { Email="e@e.com", PasswordSalt=salt, PasswordHash=hash });
        repo.Setup(r => r.GetUserRole("e@e.com")).Returns("Student");
        repo.Setup(r => r.GetStudentByEmail("e@e.com")).Returns((Student?)null);

        var controller = new AuthController(repo.Object, helper);
        var result = controller.Login(new UserForLoginDto { Email="e@e.com", Password="P@ssw0rd" });

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public void Login_ExceptionPath_Returns500()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetAuthByEmail("e@e.com")).Throws(new System.Exception("DB down"));
        var controller = new AuthController(repo.Object, CreateAuthHelper());

        var result = controller.Login(new UserForLoginDto { Email="e@e.com", Password="x" });

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, obj.StatusCode);
    }

    [Fact]
    public void RefreshToken_MissingClaims_ReturnsUnauthorized()
    {
        var controller = new AuthController(new Mock<IAuthRepository>().Object, CreateAuthHelper());
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) } };

        var result = controller.RefreshToken();

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public void RefreshToken_ValidClaims_ReturnsNewToken()
    {
        var helper = CreateAuthHelper();
        var repo = new Mock<IAuthRepository>();
        var controller = new AuthController(repo.Object, helper);

        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "e@e.com"),
            new Claim(ClaimTypes.Role, "Student"),
            new Claim("studentId", "1"),
        }, "TestAuth");
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };

        var result = controller.RefreshToken();

        var ok = Assert.IsType<OkObjectResult>(result);
        var val = ok.Value!;
        string token = (string)val.GetType().GetProperty("token")!.GetValue(val)!;
        string role = (string)val.GetType().GetProperty("role")!.GetValue(val)!;
        string email = (string)val.GetType().GetProperty("email")!.GetValue(val)!;
        Assert.False(string.IsNullOrWhiteSpace(token));
        Assert.Equal("Student", role);
        Assert.Equal("e@e.com", email);
    }

    [Fact]
    public void Profile_MissingClaims_ReturnsUnauthorized()
    {
        var controller = new AuthController(new Mock<IAuthRepository>().Object, CreateAuthHelper());
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) } };

        var result = controller.GetProfile();

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public void Profile_StudentSuccess_ReturnsOkPayload()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetStudentByEmail("e@e.com")).Returns(new Student { StudentId=7, FirstName="A", LastName="B", Email="e@e.com", TeacherId=2, Active=true });
        var controller = new AuthController(repo.Object, CreateAuthHelper());

        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "e@e.com"),
            new Claim(ClaimTypes.Role, "Student"),
            new Claim("studentId", "7"),
        }, "TestAuth");
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };

        var result = controller.GetProfile();

        var ok = Assert.IsType<OkObjectResult>(result);
        var val = ok.Value!;
        int id = (int)val.GetType().GetProperty("id")!.GetValue(val)!;
        string firstName = (string)val.GetType().GetProperty("firstName")!.GetValue(val)!;
        string role = (string)val.GetType().GetProperty("role")!.GetValue(val)!;
        Assert.Equal(7, id);
        Assert.Equal("A", firstName);
        Assert.Equal("Student", role);
    }

    [Fact]
    public void Profile_StudentNotFound_Returns404()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetStudentByEmail("e@e.com")).Returns((Student?)null);
        var controller = new AuthController(repo.Object, CreateAuthHelper());

        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "e@e.com"),
            new Claim(ClaimTypes.Role, "Student")
        }, "TestAuth");
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };

        var result = controller.GetProfile();

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void Profile_TeacherSuccess_ReturnsOkPayload()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetTeacherByEmail("t@e.com")).Returns(new Teacher { TeacherId=11, FirstName="T", LastName="R", Email="t@e.com", Active=true });
        var controller = new AuthController(repo.Object, CreateAuthHelper());

        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "t@e.com"),
            new Claim(ClaimTypes.Role, "Teacher"),
            new Claim("teacherId", "11"),
        }, "TestAuth");
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };

        var result = controller.GetProfile();

        var ok = Assert.IsType<OkObjectResult>(result);
        var val = ok.Value!;
        int id = (int)val.GetType().GetProperty("id")!.GetValue(val)!;
        string role = (string)val.GetType().GetProperty("role")!.GetValue(val)!;
        Assert.Equal(11, id);
        Assert.Equal("Teacher", role);
    }

    [Fact]
    public void Profile_TeacherNotFound_Returns404()
    {
        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetTeacherByEmail("t@e.com")).Returns((Teacher?)null);
        var controller = new AuthController(repo.Object, CreateAuthHelper());

        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "t@e.com"),
            new Claim(ClaimTypes.Role, "Teacher")
        }, "TestAuth");
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };

        var result = controller.GetProfile();

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void Login_WithEnvironmentVariables_ShouldWork()
    {
        // Set environment variables first
        SetEnvironmentVariable("PASSWORD_KEY", "env-password-key");
        SetEnvironmentVariable("TOKEN_KEY", "this-is-a-very-long-token-key-for-jwt-signing-that-should-be-at-least-64-characters-long-to-work-properly-with-hmacsha512");
        
        // Create helper with config that includes environment variables
        var config = new ConfigurationBuilder()
            .AddEnvironmentVariables()
            .Build();
        var helper = new AuthHelper(config);
        
        var salt = helper.GetPasswordSalt();
        var hash = helper.GetPasswordHash("P@ssw0rd", salt);

        var repo = new Mock<IAuthRepository>();
        repo.Setup(r => r.GetAuthByEmail("e@e.com")).Returns(new Auth {
            Email="e@e.com", PasswordSalt=salt, PasswordHash=hash
        });
        repo.Setup(r => r.GetUserRole("e@e.com")).Returns("Student");
        repo.Setup(r => r.GetStudentByEmail("e@e.com")).Returns(new Student { StudentId=1, Email="e@e.com", FirstName="A", LastName="B", Active=true });

        var controller = new AuthController(repo.Object, helper);

        var result = controller.Login(new UserForLoginDto { Email="e@e.com", Password="P@ssw0rd" });

        // Debug: Check what type we actually got
        if (result is ObjectResult objResult && objResult.StatusCode == 500)
        {
            throw new Exception($"Login failed with 500 error: {objResult.Value}");
        }
        
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }
}
