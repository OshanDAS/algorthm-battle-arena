using Xunit;
using Moq;
using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Models;
using System.Threading.Tasks;
using System;

namespace AlgorithmBattleArena.Tests;

public class SubmissionRepositoryTests
{
    private readonly Mock<IDataContextDapper> _mockDapper;
    private readonly SubmissionRepository _repository;

    public SubmissionRepositoryTests()
    {
        _mockDapper = new Mock<IDataContextDapper>();
        _repository = new SubmissionRepository(_mockDapper.Object);
    }

    [Fact]
    public async Task CreateSubmission_ValidSubmission_ReturnsSubmissionId()
    {
        var submission = new Submission
        {
            MatchId = 1,
            ProblemId = 2,
            ParticipantEmail = "test@example.com",
            Language = "C#",
            Code = "public class Solution { }",
            Status = "Pending"
        };
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(123);

        var result = await _repository.CreateSubmission(submission);

        Assert.Equal(123, result);
        _mockDapper.Verify(d => d.LoadDataSingleAsync<int>(
            It.Is<string>(s => s.Contains("INSERT INTO AlgorithmBattleArinaSchema.Submissions") &&
                              s.Contains("VALUES (@MatchId, @ProblemId, @ParticipantEmail, @Language, @Code, @Status)") &&
                              s.Contains("SELECT CAST(SCOPE_IDENTITY() as int)")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task CreateSubmission_WithAllParameters_PassesCorrectValues()
    {
        var submission = new Submission
        {
            MatchId = 5,
            ProblemId = 10,
            ParticipantEmail = "student@test.com",
            Language = "Python",
            Code = "def solution(): pass",
            Status = "Submitted"
        };
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(456);

        var result = await _repository.CreateSubmission(submission);

        Assert.Equal(456, result);
        _mockDapper.Verify(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task CreateSubmission_WithEmptyStrings_HandlesEmptyValues()
    {
        var submission = new Submission
        {
            MatchId = 1,
            ProblemId = 1,
            ParticipantEmail = "",
            Language = "",
            Code = "",
            Status = ""
        };
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(789);

        var result = await _repository.CreateSubmission(submission);

        Assert.Equal(789, result);
        _mockDapper.Verify(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task CreateSubmission_DatabaseReturnsZero_ReturnsZero()
    {
        var submission = new Submission
        {
            MatchId = 1,
            ProblemId = 1,
            ParticipantEmail = "test@test.com",
            Language = "Java",
            Code = "class Solution {}",
            Status = "Failed"
        };
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(0);

        var result = await _repository.CreateSubmission(submission);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task CreateSubmission_WithSpecialCharacters_HandlesSpecialCharacters()
    {
        var submission = new Submission
        {
            MatchId = 1,
            ProblemId = 1,
            ParticipantEmail = "test+user@example.com",
            Language = "C++",
            Code = "// Special chars: <>\"'&\nint main() { return 0; }",
            Status = "Completed"
        };
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(999);

        var result = await _repository.CreateSubmission(submission);

        Assert.Equal(999, result);
        _mockDapper.Verify(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>()), Times.Once);
    }


}