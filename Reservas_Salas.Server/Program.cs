using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.Services;
using Reservas_Salas.Server.Services.Implementations;
using Reservas_Salas.Server.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

//CORS policies
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",   // Vite (frontend React)
            "https://localhost:5173",  // versión HTTPS por si acaso
            "http://localhost:57696",  // tu antiguo frontend (opcional)
            "https://localhost:57696"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Reservas API", Version = "v1" });
});
builder.Services.AddScoped<ITSalaService, TSalaService>();
builder.Services.AddScoped<ITEmpleadoService, TEmpleadoService>();
builder.Services.AddScoped<ITReservaService, TReservaService>();
builder.Services.AddScoped<IOtpService, OtpService>();

builder.Services.AddDistributedMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

var app = builder.Build();

app.UseSession();
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("FrontendPolicy");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseSession();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
