using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlgorithmBattleArina.Attributes;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Helpers;
using AlgorithmBattleArina.Models;
using System.Security.Claims;
using System.Text.Json;

namespace AlgorithmBattleArina.Controllers
{
    [AdminOnly]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly DataContextEF _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(DataContextEF context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? q, [FromQuery] string? role, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            try
            {
                var studentsQuery = _context.Student.AsQueryable();
                var teachersQuery = _context.Teachers.AsQueryable();

                // Apply search filter
                if (!string.IsNullOrEmpty(q))
                {
                    studentsQuery = studentsQuery.Where(s => s.FirstName!.Contains(q) || s.LastName!.Contains(q) || s.Email.Contains(q));
                    teachersQuery = teachersQuery.Where(t => t.FirstName!.Contains(q) || t.LastName!.Contains(q) || t.Email.Contains(q));
                }

                var users = new List<AdminUserDto>();

                // Add students if no role filter or role is "Student"
                if (string.IsNullOrEmpty(role) || role == "Student")
                {
                    var students = await studentsQuery.Select(s => new AdminUserDto
                    {
                        Id = $"Student:{s.StudentId}",
                        Name = $"{s.FirstName} {s.LastName}".Trim(),
                        Email = s.Email,
                        Role = "Student",
                        IsActive = s.Active,
                        CreatedAt = DateTime.UtcNow // Note: No CreatedAt field in model, using current time
                    }).ToListAsync();
                    users.AddRange(students);
                }

                // Add teachers if no role filter or role is "Teacher"
                if (string.IsNullOrEmpty(role) || role == "Teacher")
                {
                    var teachers = await teachersQuery.Select(t => new AdminUserDto
                    {
                        Id = $"Teacher:{t.TeacherId}",
                        Name = $"{t.FirstName} {t.LastName}".Trim(),
                        Email = t.Email,
                        Role = "Teacher",
                        IsActive = t.Active,
                        CreatedAt = DateTime.UtcNow // Note: No CreatedAt field in model, using current time
                    }).ToListAsync();
                    users.AddRange(teachers);
                }

                // Sort by CreatedAt descending and apply pagination
                var sortedUsers = users.OrderByDescending(u => u.CreatedAt).ToList();
                var total = sortedUsers.Count;
                var pagedUsers = sortedUsers.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                var result = new PagedResult<AdminUserDto>
                {
                    Items = pagedUsers,
                    Total = total
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("users/{id}/deactivate")]
        public async Task<IActionResult> ToggleUserActive(string id, [FromBody] UserToggleDto request)
        {
            try
            {
                // Mark that we're handling audit logging in controller
                HttpContext.Items["AuditControllerLogged"] = true;

                var (role, numericId) = ParseUserId(id);
                if (string.IsNullOrEmpty(role) || numericId == 0)
                {
                    return BadRequest("Invalid user ID format");
                }

                AdminUserDto? user = null;
                bool oldActiveState = false;

                if (role == "Student")
                {
                    var student = await _context.Student.FindAsync(numericId);
                    if (student == null) return NotFound("Student not found");

                    oldActiveState = student.Active;
                    student.Active = !request.Deactivate;
                    await _context.SaveChangesAsync();

                    user = new AdminUserDto
                    {
                        Id = $"Student:{student.StudentId}",
                        Name = $"{student.FirstName} {student.LastName}".Trim(),
                        Email = student.Email,
                        Role = "Student",
                        IsActive = student.Active,
                        CreatedAt = DateTime.UtcNow
                    };
                }
                else if (role == "Teacher")
                {
                    var teacher = await _context.Teachers.FindAsync(numericId);
                    if (teacher == null) return NotFound("Teacher not found");

                    oldActiveState = teacher.Active;
                    teacher.Active = !request.Deactivate;
                    await _context.SaveChangesAsync();

                    user = new AdminUserDto
                    {
                        Id = $"Teacher:{teacher.TeacherId}",
                        Name = $"{teacher.FirstName} {teacher.LastName}".Trim(),
                        Email = teacher.Email,
                        Role = "Teacher",
                        IsActive = teacher.Active,
                        CreatedAt = DateTime.UtcNow
                    };
                }
                else
                {
                    return BadRequest("Invalid role");
                }

                // Create explicit audit log entry
                await CreateAuditLogAsync(id, oldActiveState, !request.Deactivate, request.Deactivate);

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling user active state for ID: {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        private (string role, int id) ParseUserId(string userId)
        {
            if (userId.Contains(':'))
            {
                var parts = userId.Split(':');
                if (parts.Length == 2 && int.TryParse(parts[1], out int id))
                {
                    return (parts[0], id);
                }
            }
            else if (int.TryParse(userId, out int numericId))
            {
                // If just numeric, we'd need additional logic to determine role
                // For now, return empty role to indicate ambiguity
                return ("", numericId);
            }

            return ("", 0);
        }

        private async Task CreateAuditLogAsync(string resourceId, bool beforeState, bool afterState, bool deactivate)
        {
            try
            {
                var user = HttpContext.User;
                var actorUserId = GetActorUserId(user);
                var actorEmail = user.FindFirst(ClaimTypes.Email)?.Value ?? user.FindFirst("email")?.Value ?? "";
                var correlationId = HttpContext.Items["CorrelationId"]?.ToString() ?? 
                                   HttpContext.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? 
                                   Guid.NewGuid().ToString();

                var sourceIp = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                              HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";

                var details = JsonSerializer.Serialize(new
                {
                    before = new { isActive = beforeState },
                    after = new { isActive = afterState }
                });

                var auditLog = new AuditLog
                {
                    ActorUserId = actorUserId,
                    ActorEmail = actorEmail,
                    Action = deactivate ? "UserDeactivated" : "UserReactivated",
                    ResourceType = "User",
                    ResourceId = resourceId,
                    Details = details,
                    TimestampUtc = DateTime.UtcNow,
                    SourceIp = sourceIp,
                    Route = $"{HttpContext.Request.Method} {HttpContext.Request.Path}",
                    CorrelationId = correlationId
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create audit log entry");
            }
        }

        private string GetActorUserId(ClaimsPrincipal user)
        {
            var role = user.FindFirst(ClaimTypes.Role)?.Value ?? user.FindFirst("role")?.Value;
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value ?? "";

            return role switch
            {
                "Student" => $"Student:{userId}",
                "Teacher" => $"Teacher:{userId}",
                "Admin" => $"Admin:{userId}",
                _ => userId
            };
        }
    }
}