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

public class AuthControllerTests
{
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
}
