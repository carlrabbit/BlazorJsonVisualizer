using BlazorJsonVisualizer.SchemaOverlaySample.Components;
using BlazorJsonVisualizer.PreparedDocuments;

var builder = WebApplication.CreateBuilder(args);

var preparedStoreRoot = Path.Combine(Path.GetTempPath(), "BlazorJsonVisualizer", "SchemaOverlaySample", "prepared-store");
Directory.CreateDirectory(preparedStoreRoot);
var preparedStore = new FilePreparedJsonDocumentStore(preparedStoreRoot);

builder.Services.AddSingleton(preparedStore);
builder.Services.AddSingleton<IPreparedJsonDocumentStore>(preparedStore);
builder.Services.AddSingleton<IJsonDocumentImporter>(new FileJsonDocumentImporter(preparedStore));
builder.Services.AddSingleton<IPreparedDocumentRuntimeBridge>(new PreparedDocumentRuntimeBridge(preparedStore));

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAntiforgery();
app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
