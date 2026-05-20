#:sdk Microsoft.NET.Sdk.Web

using Microsoft.Extensions.FileProviders;

if (args.Length != 2)
{
    Console.Error.WriteLine("Usage: dotnet run scripts/dev/SamplesIndexServer.cs -- <directory> <url>");
    return 1;
}

var directory = Path.GetFullPath(args[0]);
var url = args[1];

if (!Directory.Exists(directory))
{
    Console.Error.WriteLine($"Static content directory does not exist: {directory}");
    return 1;
}

var builder = WebApplication.CreateBuilder();
builder.WebHost.UseUrls(url);

var app = builder.Build();
var fileProvider = new PhysicalFileProvider(directory);

app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = fileProvider,
    RequestPath = string.Empty
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = fileProvider,
    RequestPath = string.Empty
});

app.Run();
return 0;
