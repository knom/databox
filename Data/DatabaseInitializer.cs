namespace Databox.Data;

public static class DatabaseInitializer
{
    public static void EnsureDatabaseCreated(this IHost host)
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DataboxContext>();
        db.Database.EnsureCreated();
    }
}
