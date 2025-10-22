using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VibeApp.API.Features.Vibes;

namespace VibeApp.API.Infrastructure.Configurations;

public class VibeConfiguration : IEntityTypeConfiguration<Vibe>
{
    public void Configure(EntityTypeBuilder<Vibe> builder)
    {
        builder.ToTable("Vibes");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Content)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(v => v.UserId)
            .IsRequired();

        builder.Property(v => v.MediaUrl)
            .HasMaxLength(2048);

        builder.Property(v => v.Type)
            .IsRequired()
            .HasConversion<string>(); // Store enum as string in database

        builder.Property(v => v.IsPublic)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(v => v.LikesCount)
            .HasDefaultValue(0);

        builder.Property(v => v.CommentsCount)
            .HasDefaultValue(0);

        builder.Property(v => v.SharesCount)
            .HasDefaultValue(0);

        builder.Property(v => v.CreatedAt)
            .IsRequired();

        builder.Property(v => v.UpdatedAt)
            .IsRequired();

        builder.Property(v => v.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        // Indexes for performance
        builder.HasIndex(v => v.UserId);
        builder.HasIndex(v => v.CreatedAt);
        builder.HasIndex(v => v.IsDeleted);
        builder.HasIndex(v => new { v.IsPublic, v.LikesCount })
            .HasDatabaseName("IX_Vibes_Trending");

        // Global query filter to exclude soft-deleted records
        builder.HasQueryFilter(v => !v.IsDeleted);
    }
}
