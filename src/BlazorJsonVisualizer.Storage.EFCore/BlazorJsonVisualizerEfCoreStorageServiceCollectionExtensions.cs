using BlazorJsonVisualizer.PreparedDocuments;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BlazorJsonVisualizer.Storage.EFCore;

public static class BlazorJsonVisualizerEfCoreStorageServiceCollectionExtensions
{
    public static IServiceCollection AddBlazorJsonVisualizerEfCoreStorage<TContext>(
        this IServiceCollection services)
        where TContext : DbContext, IBlazorJsonVisualizerStorageDbContext
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<EfCorePreparedJsonDocumentStore<TContext>>(sp =>
        {
            var factory = sp.GetRequiredService<IDbContextFactory<TContext>>();
            return new EfCorePreparedJsonDocumentStore<TContext>(factory);
        });

        services.AddScoped<IPreparedJsonDocumentStore>(sp =>
            sp.GetRequiredService<EfCorePreparedJsonDocumentStore<TContext>>());

        services.AddScoped<EfCoreJsonDocumentImporter<TContext>>(sp =>
            new EfCoreJsonDocumentImporter<TContext>(sp.GetRequiredService<EfCorePreparedJsonDocumentStore<TContext>>()));

        services.AddScoped<IJsonDocumentImporter>(sp =>
            sp.GetRequiredService<EfCoreJsonDocumentImporter<TContext>>());

        return services;
    }
}
