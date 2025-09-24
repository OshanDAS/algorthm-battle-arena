using Xunit;
using Microsoft.Extensions.Configuration;
using AlgorithmBattleArina.Helpers;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Models;
using System.Collections.Generic;

namespace AlgorithmBattleArena.Tests;

public class CompilationTest
{
    [Fact]
    public void AllDtosCompile()
    {
        var filter = new ProblemFilterDto();
        var list = new ProblemListDto();
        var response = new ProblemResponseDto();
        var student = new StudentForRegistrationDto();
        var teacher = new TeacherForRegistrationDto();
        var login = new UserForLoginDto();
        
        Assert.NotNull(filter);
        Assert.NotNull(list);
        Assert.NotNull(response);
        Assert.NotNull(student);
        Assert.NotNull(teacher);
        Assert.NotNull(login);
    }

    [Fact]
    public void AllModelsCompile()
    {
        var auth = new Auth();
        var student = new Student();
        var teacher = new Teacher();
        var problem = new Problem();
        var testCase = new ProblemTestCase();
        var solution = new ProblemSolution();
        
        Assert.NotNull(auth);
        Assert.NotNull(student);
        Assert.NotNull(teacher);
        Assert.NotNull(problem);
        Assert.NotNull(testCase);
        Assert.NotNull(solution);
    }

    [Fact]
    public void AuthHelperCompiles()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AppSettings:PasswordKey"] = "test-key",
                ["AppSettings:TokenKey"] = "test-token-key-long-enough-for-hmac"
            })
            .Build();
            
        var helper = new AuthHelper(config);
        Assert.NotNull(helper);
    }
}