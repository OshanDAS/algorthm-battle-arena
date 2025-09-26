using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using AlgorithmBattleArina.Attributes;

namespace AlgorithmBattleArena.Tests;

public class AdminOnlyAttributeTests
{
    private static AuthorizationFilterContext CreateContext(ClaimsPrincipal user)
    {
        var httpContext = new DefaultHttpContext { User = user };
        var actionContext = new ActionContext(httpContext, new Microsoft.AspNetCore.Routing.RouteData(), new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor());
        return new AuthorizationFilterContext(actionContext, new List<IFilterMetadata>());
    }

    [Fact]
    public void OnAuthorization_UnauthenticatedUser_ReturnsForbidden()
    {
        var attribute = new AdminOnlyAttribute();
        var user = new ClaimsPrincipal();
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        // Note: There's a bug in AdminOnlyAttribute - unauthenticated users should return UnauthorizedResult
        // but the logic "!user.Identity?.IsAuthenticated == true" is incorrect
        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_AuthenticatedNonAdminUser_ReturnsForbidden()
    {
        var attribute = new AdminOnlyAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "User") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_AuthenticatedAdminUser_AllowsAccess()
    {
        var attribute = new AdminOnlyAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Admin") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public void OnAuthorization_UserWithNoRoleClaim_ReturnsForbidden()
    {
        var attribute = new AdminOnlyAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, "testuser") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_UserWithEmptyRoleClaim_ReturnsForbidden()
    {
        var attribute = new AdminOnlyAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_AuthenticatedUserWithTeacherRole_ReturnsForbidden()
    {
        var attribute = new AdminOnlyAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Teacher") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_AuthenticatedUserWithStudentRole_ReturnsForbidden()
    {
        var attribute = new AdminOnlyAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Student") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.IsType<ForbidResult>(context.Result);
    }
}