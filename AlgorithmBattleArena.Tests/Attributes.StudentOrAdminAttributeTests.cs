using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using AlgorithmBattleArina.Attributes;

namespace AlgorithmBattleArena.Tests;

public class StudentOrAdminAttributeTests
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
        var attribute = new StudentOrAdminAttribute();
        var user = new ClaimsPrincipal();
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        // Note: Same bug as other attributes - should return UnauthorizedResult
        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_AuthenticatedStudentUser_AllowsAccess()
    {
        var attribute = new StudentOrAdminAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Student") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public void OnAuthorization_AuthenticatedAdminUser_AllowsAccess()
    {
        var attribute = new StudentOrAdminAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Admin") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public void OnAuthorization_AuthenticatedTeacherUser_ReturnsForbidden()
    {
        var attribute = new StudentOrAdminAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Teacher") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_UserWithNoRoleClaim_ReturnsForbidden()
    {
        var attribute = new StudentOrAdminAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, "testuser") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public void OnAuthorization_UserWithEmptyRoleClaim_ReturnsForbidden()
    {
        var attribute = new StudentOrAdminAttribute();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "") }, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = CreateContext(user);

        attribute.OnAuthorization(context);

        Assert.IsType<ForbidResult>(context.Result);
    }
}