using AlgorithmBattleArina.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace AlgorithmBattleArina.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LobbiesController : ControllerBase
    {
        private readonly ILobbyRepository _lobbyRepository;

        public LobbiesController(ILobbyRepository lobbyRepository)
        {
            _lobbyRepository = lobbyRepository;
        }

        [HttpGet]
        public ActionResult<IEnumerable<LobbyInfo>> GetLobbies()
        {
            var lobbies = _lobbyRepository.GetLobbies();
            return Ok(lobbies);
        }
    }
}
