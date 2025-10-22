namespace VibeApp.API.Shared.Constants;

public static class AppConstants
{
    public const string ApplicationName = "VibeApp";
    public const string ApiVersion = "v1";
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public static class Roles
    {
        public const string Admin = "Admin";
        public const string User = "User";
        public const string Moderator = "Moderator";
    }

    public static class CacheKeys
    {
        public const string UserPrefix = "user_";
        public const string VibePrefix = "vibe_";
    }
}
