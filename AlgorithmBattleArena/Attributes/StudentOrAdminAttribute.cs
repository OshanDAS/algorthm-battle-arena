using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace AlgorithmBattleArina.Attributes
{
    public class StudentOrAdminAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;
            
            if (!user.Identity?.IsAuthenticated == true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Student" && role != "Admin")
            {
                context.Result = new ForbidResult();
            }
        }
    }
}