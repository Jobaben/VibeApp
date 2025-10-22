using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VibeApp.API.Infrastructure.Data;

/// <summary>
/// Factory for creating ApplicationDbContext instances at design-time (for migrations).
/// </summary>
public class DbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        // Use a default connection string for migrations
        optionsBuilder.UseSqlServer(
            "Server=(localdb)\\mssqllocaldb;Database=VibeAppDb;Trusted_Connection=True;MultipleActiveResultSets=true",
            b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
