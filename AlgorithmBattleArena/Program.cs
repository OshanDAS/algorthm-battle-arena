using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Helpers;
using AlgorithmBattleArina.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// Register DbContexts, repositories, and helpers
builder.Services.AddDbContext<DataContextEF>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

builder.Services.AddScoped<IDataContextDapper, DataContextDapper>();
builder.Services.AddScoped<ILobbyRepository, InMemoryLobbyRepository>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddSingleton<AuthHelper>();


// JWT Authentication configuration
var tokenKey = builder.Configuration.GetValue<string>("AppSettings:TokenKey");
if (string.IsNullOrEmpty(tokenKey))
{
    throw new Exception("JWT TokenKey is missing in configuration!");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:3000", "http://localhost:8000", "http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });

    options.AddPolicy("ProdCors", policy =>
    {
        policy.WithOrigins("https://myProductionSite.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseCors("ProdCors");
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MatchHub>("/matchhub");


app.Run();

public partial class Program { }