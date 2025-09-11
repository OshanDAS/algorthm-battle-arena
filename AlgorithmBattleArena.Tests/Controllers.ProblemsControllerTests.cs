using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using AlgorithmBattleArina.Controllers;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Models;
using System.Collections.Generic;

namespace AlgorithmBattleArena.Tests;

public class ProblemsControllerTests
{
    private static ProblemsController CreateController(Mock<IDataContextDapper> dapperMock)
    {
        var logger = new Mock<ILogger<ProblemsController>>();
        return new ProblemsController(dapperMock.Object, logger.Object);
    }

    [Fact]
    public void GetProblems_ReturnsPagedList()
    {
        var dapper = new Mock<IDataContextDapper>();
        dapper.Setup(d => d.LoadDataSingle<int>(It.Is<string>(s => s.StartsWith("SELECT COUNT(*)")), It.IsAny<object>())).Returns(2);
        dapper.Setup(d => d.LoadData<ProblemListDto>(It.Is<string>(s => s.Contains("ORDER BY CreatedAt DESC")), It.IsAny<object>()))
              .Returns(new List<ProblemListDto> {
                  new ProblemListDto { ProblemId=1, Title="A", Category="DP", DifficultyLevel="Easy", CreatedBy="t", CreatedAt=System.DateTime.UtcNow },
                  new ProblemListDto { ProblemId=2, Title="B", Category="Graph", DifficultyLevel="Hard", CreatedBy="t", CreatedAt=System.DateTime.UtcNow }
              });

        var controller = CreateController(dapper);
        var filter = new ProblemFilterDto { Page = 1, PageSize = 10 };
        var result = controller.GetProblems(filter);

        var ok = Assert.IsType<OkObjectResult>(result);
        var val = ok.Value!;
        int page = (int)val.GetType().GetProperty("page")!.GetValue(val)!;
        int pageSize = (int)val.GetType().GetProperty("pageSize")!.GetValue(val)!;
        int total = (int)val.GetType().GetProperty("total")!.GetValue(val)!;
        var problems = (IEnumerable<ProblemListDto>)val.GetType().GetProperty("problems")!.GetValue(val)!;

        Assert.Equal(1, page);
        Assert.Equal(10, pageSize);
        Assert.Equal(2, total);
        Assert.Collection(problems,
            p => Assert.Equal(1, p.ProblemId),
            p => Assert.Equal(2, p.ProblemId)
        );
    }

    [Fact]
    public void GetProblem_NotFound_Returns404()
    {
        var dapper = new Mock<IDataContextDapper>();
        dapper.Setup(d => d.LoadDataSingle<Problem>(It.IsAny<string>(), It.IsAny<object>())).Returns((Problem)null!);
        var controller = CreateController(dapper);

        var result = controller.GetProblem(123);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void GetProblem_ReturnsDtoWithTestCasesAndSolutions()
    {
        var dapper = new Mock<IDataContextDapper>();
        dapper.Setup(d => d.LoadDataSingle<Problem>(It.IsAny<string>(), It.IsAny<object>())).Returns(new Problem
        {
            ProblemId = 5,
            Title = "Two Sum",
            Description = "Find pair",
            DifficultyLevel = "Easy",
            Category = "Array",
            TimeLimit = 1,
            MemoryLimit = 256,
            CreatedBy = "t",
            Tags = "hash",
            CreatedAt = System.DateTime.UtcNow
        });
        dapper.Setup(d => d.LoadData<ProblemTestCase>(It.IsAny<string>(), It.IsAny<object>()))
              .Returns(new List<ProblemTestCase> { new ProblemTestCase { TestCaseId=1, ProblemId=5, InputData="a", ExpectedOutput="b" } });
        dapper.Setup(d => d.LoadData<ProblemSolution>(It.IsAny<string>(), It.IsAny<object>()))
              .Returns(new List<ProblemSolution> { new ProblemSolution { ProblemId=5, Language="C#", SolutionText="//..." } });

        var controller = CreateController(dapper);

        var result = controller.GetProblem(5);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<ProblemResponseDto>(ok.Value);
        Assert.Equal(5, dto.ProblemId);
        Assert.Single(dto.TestCases);
        Assert.Single(dto.Solutions);
    }

    [Fact]
    public void DeleteProblem_NotFound_Returns404()
    {
        var dapper = new Mock<IDataContextDapper>();
        dapper.Setup(d => d.LoadDataSingle<int?>(It.IsAny<string>(), It.IsAny<object>())).Returns((int?)null);
        var controller = CreateController(dapper);

        var result = controller.DeleteProblem(9);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public void DeleteProblem_FailsDeletion_Returns500()
    {
        var dapper = new Mock<IDataContextDapper>();
        dapper.Setup(d => d.LoadDataSingle<int?>(It.IsAny<string>(), It.IsAny<object>())).Returns(9);
        dapper.Setup(d => d.ExecuteSql(It.IsAny<string>(), It.IsAny<object>())).Returns(false);
        var controller = CreateController(dapper);

        var result = controller.DeleteProblem(9);

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, obj.StatusCode);
    }

    [Fact]
    public void DeleteProblem_Succeeds_ReturnsOk()
    {
        var dapper = new Mock<IDataContextDapper>();
        dapper.Setup(d => d.LoadDataSingle<int?>(It.IsAny<string>(), It.IsAny<object>())).Returns(9);
        dapper.Setup(d => d.ExecuteSql(It.IsAny<string>(), It.IsAny<object>())).Returns(true);
        var controller = CreateController(dapper);

        var result = controller.DeleteProblem(9);

        Assert.IsType<OkObjectResult>(result);
    }
}
