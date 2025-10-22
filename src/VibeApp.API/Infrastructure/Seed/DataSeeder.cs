using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VibeApp.API.Infrastructure.Data;

namespace VibeApp.API.Infrastructure.Seed;

public class DataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public DataSeeder(
        ApplicationDbContext context,
        UserManager<IdentityUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task SeedAsync()
    {
        // Ensure database is created
        await _context.Database.MigrateAsync();

        // Seed roles
        await SeedRolesAsync();

        // Seed users
        await SeedUsersAsync();

        // Additional seed data will be added here as features are implemented
    }

    private async Task SeedRolesAsync()
    {
        string[] roles = { "Admin", "User", "Moderator" };

        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }

    private async Task SeedUsersAsync()
    {
        // Create a default admin user if it doesn't exist
        var adminEmail = "admin@vibeapp.com";
        var existingUser = await _userManager.FindByEmailAsync(adminEmail);

        if (existingUser == null)
        {
            var adminUser = new IdentityUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(adminUser, "Admin@123");

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }
}
