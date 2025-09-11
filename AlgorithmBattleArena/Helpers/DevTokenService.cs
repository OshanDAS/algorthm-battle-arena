using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AlgorithmBattleArena.Helpers
{
    /// <summary>
    /// Small helper to generate JWTs for local development/testing.
    /// Do NOT use in production as-is.
    /// Usage: new DevTokenService(config).GenerateToken("user1", minutes: 60);
    /// </summary>
    public class DevTokenService
    {
        private readonly string _secret;
        private readonly int _expiryMinutes;

        public DevTokenService(IConfiguration cfg, int expiryMinutes = 60)
        {
            _secret = cfg["Jwt:Secret"] ?? throw new ArgumentException("Jwt:Secret missing in config");
            _expiryMinutes = expiryMinutes;
        }

        public string GenerateToken(string userId, string displayName = "dev-user")
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;
            var token = new JwtSecurityToken(
                claims: new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Name, displayName)
                },
                notBefore: now,
                expires: now.AddMinutes(_expiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
