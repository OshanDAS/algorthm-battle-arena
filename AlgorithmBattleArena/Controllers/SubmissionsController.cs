using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Helpers;
using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace AlgorithmBattleArina.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SubmissionsController : ControllerBase
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly AuthHelper _authHelper;

        public SubmissionsController(ISubmissionRepository submissionRepository, AuthHelper authHelper)
        {
            _submissionRepository = submissionRepository;
            _authHelper = authHelper;
        }

        [HttpPost]
        public async Task<IActionResult> CreateSubmission([FromBody] SubmissionDto dto)
        {
            var userEmail = _authHelper.GetEmailFromClaims(User);
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized();
            }

            var submission = new Submission
            {
                MatchId = dto.MatchId,
                ProblemId = dto.ProblemId,
                ParticipantEmail = userEmail,
                Language = dto.Language,
                Code = dto.Code,
                Status = "Submitted"
            };

            var submissionId = await _submissionRepository.CreateSubmission(submission);

            return Ok(new { SubmissionId = submissionId });
        }
    }
}
