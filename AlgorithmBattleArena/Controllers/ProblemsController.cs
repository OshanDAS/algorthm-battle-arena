using Microsoft.AspNetCore.Mvc;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Helpers;

namespace AlgorithmBattleArina.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class ProblemsController : ControllerBase
    {
        private readonly IDataContextDapper _dapper;
        private readonly ILogger<ProblemsController> _logger;

        public ProblemsController(IDataContextDapper dapper, ILogger<ProblemsController> logger)
        {
            _dapper = dapper;
            _logger = logger;
        }

        [HttpPost("UpsertProblem")]
        public IActionResult UpsertProblem([FromBody] ProblemUpsertDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var parameters = new Dapper.DynamicParameters();
            parameters.Add("@Title", dto.Title);
            parameters.Add("@Description", dto.Description);
            parameters.Add("@DifficultyLevel", dto.DifficultyLevel);
            parameters.Add("@Category", dto.Category);
            parameters.Add("@TimeLimit", dto.TimeLimit);
            parameters.Add("@MemoryLimit", dto.MemoryLimit);
            parameters.Add("@CreatedBy", dto.CreatedBy);
            parameters.Add("@Tags", dto.Tags);
            parameters.Add("@TestCases", dto.TestCases);
            parameters.Add("@Solutions", dto.Solutions);

            try
            {
                int problemId = _dapper.LoadDataSingle<int>(
                    @"EXEC AlgorithmBattleArinaSchema.spUpsertProblem 
                        @Title, @Description, @DifficultyLevel, @Category,
                        @TimeLimit, @MemoryLimit, @CreatedBy, @Tags, @TestCases, @Solutions",
                    parameters
                );

                return Ok(new { Message = "Problem upserted successfully.", ProblemId = problemId });
            }
            catch (Exception ex)
            {
                return ControllerHelper.HandleError(ex, "Failed to upsert problem", _logger);
            }
        }

        [HttpGet]
        public IActionResult GetProblems([FromQuery] ProblemFilterDto filter)
        {
            try
            {
                var sql = @"
                    SELECT ProblemId, Title, DifficultyLevel, Category, CreatedBy, CreatedAt
                    FROM AlgorithmBattleArinaSchema.Problems 
                    WHERE 1=1";

                var parameters = new Dictionary<string, object>();

                if (!string.IsNullOrEmpty(filter.Category))
                {
                    sql += " AND Category = @Category";
                    parameters["Category"] = filter.Category;
                }

                if (!string.IsNullOrEmpty(filter.DifficultyLevel))
                {
                    sql += " AND DifficultyLevel = @DifficultyLevel";
                    parameters["DifficultyLevel"] = filter.DifficultyLevel;
                }

                if (!string.IsNullOrEmpty(filter.SearchTerm))
                {
                    sql += " AND (Title LIKE @SearchTerm OR Description LIKE @SearchTerm)";
                    parameters["SearchTerm"] = $"%{filter.SearchTerm}%";
                }

                var total = _dapper.LoadDataSingle<int>(
                    "SELECT COUNT(*) FROM AlgorithmBattleArinaSchema.Problems WHERE 1=1" 
                    + (parameters.ContainsKey("Category") ? " AND Category = @Category" : "")
                    + (parameters.ContainsKey("DifficultyLevel") ? " AND DifficultyLevel = @DifficultyLevel" : "")
                    + (parameters.ContainsKey("SearchTerm") ? " AND (Title LIKE @SearchTerm OR Description LIKE @SearchTerm)" : ""),
                    parameters
                );

                sql += " ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";
                parameters["Offset"] = (filter.Page - 1) * filter.PageSize;
                parameters["PageSize"] = filter.PageSize;

                var problems = _dapper.LoadData<ProblemListDto>(sql, parameters);

                return Ok(new
                {
                    problems,
                    page = filter.Page,
                    pageSize = filter.PageSize,
                    total
                });
            }
            catch (Exception ex)
            {
                return ControllerHelper.HandleError(ex, "Error retrieving problems", _logger);
            }
        }

        [HttpGet("{id:int}")]
        public IActionResult GetProblem(int id)
        {
            try
            {
                var problem = _dapper.LoadDataSingle<Problem>(
                    "SELECT * FROM AlgorithmBattleArinaSchema.Problems WHERE ProblemId = @ProblemId",
                    new { ProblemId = id }
                );

                if (problem == null)
                    return NotFound(new { message = "Problem not found." });

                var testCases = _dapper.LoadData<ProblemTestCase>(
                    "SELECT * FROM AlgorithmBattleArinaSchema.ProblemTestCases WHERE ProblemId = @ProblemId ORDER BY TestCaseId",
                    new { ProblemId = id }
                );

                var solutions = _dapper.LoadData<ProblemSolution>(
                    "SELECT * FROM AlgorithmBattleArinaSchema.ProblemSolutions WHERE ProblemId = @ProblemId ORDER BY Language",
                    new { ProblemId = id }
                );

                return Ok(new ProblemResponseDto
                {
                    ProblemId = problem.ProblemId,
                    Title = problem.Title,
                    Description = problem.Description,
                    DifficultyLevel = problem.DifficultyLevel,
                    Category = problem.Category,
                    TimeLimit = problem.TimeLimit,
                    MemoryLimit = problem.MemoryLimit,
                    CreatedBy = problem.CreatedBy,
                    Tags = problem.Tags,
                    CreatedAt = problem.CreatedAt,
                    UpdatedAt = problem.UpdatedAt,
                    TestCases = testCases.ToList(),
                    Solutions = solutions.ToList()
                });
            }
            catch (Exception ex)
            {
                return ControllerHelper.HandleError(ex, $"Error retrieving problem {id}", _logger);
            }
        }

        [HttpDelete("{id:int}")]
        public IActionResult DeleteProblem(int id)
        {
            try
            {
                var problemExists = _dapper.LoadDataSingle<int?>(
                    "SELECT ProblemId FROM AlgorithmBattleArinaSchema.Problems WHERE ProblemId = @ProblemId",
                    new { ProblemId = id }
                );

                if (problemExists == null)
                    return NotFound(new { message = "Problem not found." });

                bool success = _dapper.ExecuteSql(
                    @"DELETE FROM AlgorithmBattleArinaSchema.ProblemSolutions WHERE ProblemId = @ProblemId;
                      DELETE FROM AlgorithmBattleArinaSchema.ProblemTestCases WHERE ProblemId = @ProblemId;
                      DELETE FROM AlgorithmBattleArinaSchema.Problems WHERE ProblemId = @ProblemId;",
                    new { ProblemId = id }
                );

                if (!success)
                    return StatusCode(500, new { message = "Failed to delete problem." });

                _logger.LogInformation("Problem {ProblemId} deleted successfully", id);
                return Ok(new { message = "Problem deleted successfully." });
            }
            catch (Exception ex)
            {
                return ControllerHelper.HandleError(ex, $"Error deleting problem {id}", _logger);
            }
        }

        [HttpGet("categories")]
        public IActionResult GetCategories() =>
            ControllerHelper.SafeExecute(() =>
                Ok(_dapper.LoadData<string>(
                    "SELECT DISTINCT Category FROM AlgorithmBattleArinaSchema.Problems ORDER BY Category")),
                "Error retrieving categories", _logger);

        [HttpGet("difficulty-levels")]
        public IActionResult GetDifficultyLevels() =>
            ControllerHelper.SafeExecute(() =>
                Ok(_dapper.LoadData<string>(
                    "SELECT DISTINCT DifficultyLevel FROM AlgorithmBattleArinaSchema.Problems ORDER BY DifficultyLevel")),
                "Error retrieving difficulty levels", _logger);
    }
}
