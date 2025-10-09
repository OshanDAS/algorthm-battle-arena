using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlgorithmBattleArena.Migrations
{
    /// <inheritdoc />
    public partial class CreateProblemsAndTestCases : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Problems",
                schema: "AlgorithmBattleArinaSchema",
                columns: table => new
                {
                    ProblemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DifficultyLevel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TimeLimit = table.Column<int>(type: "int", nullable: false),
                    MemoryLimit = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Problems", x => x.ProblemId);
                });

            migrationBuilder.CreateTable(
                name: "ProblemTestCases",
                schema: "AlgorithmBattleArinaSchema",
                columns: table => new
                {
                    TestCaseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProblemId = table.Column<int>(type: "int", nullable: false),
                    InputData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpectedOutput = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsSample = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProblemTestCases", x => x.TestCaseId);
                    table.ForeignKey(
                        name: "FK_ProblemTestCases_Problems_ProblemId",
                        column: x => x.ProblemId,
                        principalSchema: "AlgorithmBattleArinaSchema",
                        principalTable: "Problems",
                        principalColumn: "ProblemId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProblemTestCases_ProblemId",
                schema: "AlgorithmBattleArinaSchema",
                table: "ProblemTestCases",
                column: "ProblemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProblemTestCases",
                schema: "AlgorithmBattleArinaSchema");

            migrationBuilder.DropTable(
                name: "Problems",
                schema: "AlgorithmBattleArinaSchema");
        }
    }
}
