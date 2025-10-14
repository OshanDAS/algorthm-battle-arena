using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AlgorithmBattleArena.Dtos;
using AlgorithmBattleArena.Helpers;
using AlgorithmBattleArena.Attributes;
using System.Threading.Tasks;
using AlgorithmBattleArena.Repositories;

namespace AlgorithmBattleArena.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProblemsController : ControllerBase
    {
        private readonly IProblemRepository _problemRepository;
        private readonly ILogger<ProblemsController> _logger;

        public ProblemsController(IProblemRepository problemRepository, ILogger<ProblemsController> logger)
        {
            _problemRepository = problemRepository;
            _logger = logger;
        }

        [AdminOnly]
        [HttpPost("UpsertProblem")]
        public async Task<IActionResult> UpsertProblem([FromBody] ProblemUpsertDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int problemId = await _problemRepository.UpsertProblem(dto);
                return Ok(new { Message = "Problem upserted successfully.", ProblemId = problemId });
            }
            catch (Exception ex)
            {
                return ControllerHelper.HandleError(ex, "Failed to upsert problem", _logger);
            }
        }

        [StudentOrAdmin]
        [HttpGet]
        public async Task<IActionResult> GetProblems([FromQuery] ProblemFilterDto filter)
        {
            try
            {
                var result = await _problemRepository.GetProblems(filter);
                return Ok(new
                {
                    problems = result.Items,
                    page = filter.Page,
                    pageSize = filter.PageSize,
                    total = result.Total
                });
            }
            catch (Exception ex)
            {
                return ControllerHelper.HandleError(ex, "Error retrieving problems", _logger);
            }
        }

        [StudentOrAdmin]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetProblem(int id)
        {
            try
            {
                var problem = await _problemRepository.GetProblem(id);
                if (problem == null)
                    return NotFound(new { message = "Problem not found." });

                return Ok(problem);
            }
            catch (Exception ex)
            {
                return ControllerHelper.HandleError(ex, $"Error retrieving problem {id}", _logger);
            }
        }

        [AdminOnly]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteProblem(int id)
        {
            try
            {
                var success = await _problemRepository.DeleteProblem(id);
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

        [StudentOrAdmin]
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            return await ControllerHelper.SafeExecuteAsync(async () =>
                Ok(await _problemRepository.GetCategories()),
                "Error retrieving categories", _logger);
        }

        [StudentOrAdmin]
        [HttpGet("difficulty-levels")]
        public async Task<IActionResult> GetDifficultyLevels()
        {
            return await ControllerHelper.SafeExecuteAsync(async () =>
                Ok(await _problemRepository.GetDifficultyLevels()),
                "Error retrieving difficulty levels", _logger);
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateProblems([FromBody] ProblemGenerationDto dto)
        {
            try
            {
                var problems = await _problemRepository.GetRandomProblems(dto.Language, dto.Difficulty, dto.MaxProblems);
                return Ok(problems);
            }
            catch (Exception ex)
            {
                return ControllerHelper.HandleError(ex, "Error generating problems", _logger);
            }
        }
    }
}
