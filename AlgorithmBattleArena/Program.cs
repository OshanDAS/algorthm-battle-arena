using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Helpers;
using AlgorithmBattleArina.Hubs;
using AlgorithmBattleArina.Middleware;
using AlgorithmBattleArina.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using DotNetEnv;

// Load environment variables from .env file
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add environment variables to configuration
builder.Configuration.AddEnvironmentVariables();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// Register DbContexts, repositories, and helpers
var connectionString = Environment.GetEnvironmentVariable("DEFAULT_CONNECTION") ??
                       builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<DataContextEF>(options =>
    options.UseSqlServer(connectionString)
);

builder.Services.AddScoped<IDataContextDapper, DataContextDapper>();
builder.Services.AddScoped<ILobbyRepository, LobbyRepository>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IProblemRepository, ProblemRepository>();
builder.Services.AddScoped<ISubmissionRepository, SubmissionRepository>();
builder.Services.AddScoped<IMatchRepository, MatchRepository>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<ITeacherRepository, TeacherRepository>();
builder.Services.AddScoped<ProblemImportService>();
builder.Services.AddSingleton<AuthHelper>();

// JWT Authentication configuration
var tokenKey = Environment.GetEnvironmentVariable("TOKEN_KEY") ??
               builder.Configuration.GetValue<string>("AppSettings:TokenKey");

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

        // Allow SignalR to receive token via "access_token" query param
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"].ToString();
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/lobbyHub", StringComparison.OrdinalIgnoreCase) ||
                     path.StartsWithSegments("/matchhub", StringComparison.OrdinalIgnoreCase)))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

// CORS configuration - Fixed version
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:4200",
                "http://localhost:3000",
                "http://localhost:8000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });

    options.AddPolicy("ProdCors", policy =>
    {
        policy.WithOrigins("https://lemon-mud-0cd08c100.2.azurestaticapps.net")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });

    // Add a permissive policy for debugging (remove in production)
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Fixed middleware pipeline - CORS must be one of the first middlewares
app.UseCors(app.Environment.IsDevelopment() ? "DevCors" : "ProdCors");

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

// Authentication and Authorization come after CORS
app.UseAuthentication();
app.UseAuditLogging();
app.UseAuthorization();

app.MapControllers();

// SignalR hubs
app.MapHub<MatchHub>("/matchhub");
app.MapHub<MatchHub>("/lobbyHub");

app.Run();

public partial class Program { }