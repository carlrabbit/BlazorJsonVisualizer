using BlazorJsonVisualizer.PreparedDocuments;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BlazorJsonVisualizer.Storage.EFCore.Tests;

public sealed class EfCoreStorageRegistrationTests
{
    [Fact]
    public void AddBlazorJsonVisualizerEfCoreStorage_RegistersAllServices()
    {
        var services = new ServiceCollection();
        services.AddDbContextFactory<TestStorageDbContext>(opts =>
            opts.UseSqlite("DataSource=:memory:"));
        services.AddBlazorJsonVisualizerEfCoreStorage<TestStorageDbContext>();

        var provider = services.BuildServiceProvider();

        Assert.NotNull(provider.GetRequiredService<EfCorePreparedJsonDocumentStore<TestStorageDbContext>>());
        Assert.NotNull(provider.GetRequiredService<IPreparedJsonDocumentStore>());
        Assert.NotNull(provider.GetRequiredService<EfCoreJsonDocumentImporter<TestStorageDbContext>>());
        Assert.NotNull(provider.GetRequiredService<IJsonDocumentImporter>());
    }

    [Fact]
    public void AddBlazorJsonVisualizerEfCoreStorage_StoreAndImporter_AreSameScopedInstances()
    {
        var services = new ServiceCollection();
        services.AddDbContextFactory<TestStorageDbContext>(opts =>
            opts.UseSqlite("DataSource=:memory:"));
        services.AddBlazorJsonVisualizerEfCoreStorage<TestStorageDbContext>();

        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();

        var typed = scope.ServiceProvider.GetRequiredService<EfCorePreparedJsonDocumentStore<TestStorageDbContext>>();
        var iface = scope.ServiceProvider.GetRequiredService<IPreparedJsonDocumentStore>();
        Assert.Same(typed, iface);

        var typedImporter = scope.ServiceProvider.GetRequiredService<EfCoreJsonDocumentImporter<TestStorageDbContext>>();
        var ifaceImporter = scope.ServiceProvider.GetRequiredService<IJsonDocumentImporter>();
        Assert.Same(typedImporter, ifaceImporter);
    }

    [Fact]
    public void AddBlazorJsonVisualizerEfCoreStorage_NullServices_Throws()
    {
        var exception = Assert.Throws<ArgumentNullException>(
            () => ((IServiceCollection)null!).AddBlazorJsonVisualizerEfCoreStorage<TestStorageDbContext>());
        Assert.Equal("services", exception.ParamName);
    }
}
