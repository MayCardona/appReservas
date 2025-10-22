using Microsoft.EntityFrameworkCore;
using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;

namespace Reservas_Salas.Server.Services
{
    public class TEmpleadoService : ITEmpleadoService
    {
        private readonly AppDbContext _context;

        public TEmpleadoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TEmpleado>> GetAllAsync()
        {
            return await _context.TEmpleados.ToListAsync();
        }

        public async Task<TEmpleado?> GetByIdAsync(long id)
        {
            return await _context.TEmpleados.FindAsync(id);
        }

        public async Task<TEmpleado> GetByIdAndCargoAsync(long id)
        {
            return await _context.TEmpleados
                .Include(e => e.CargoNavigation)
                .FirstOrDefaultAsync(e => e.IdEmpleado == id);
        }
        public async Task<TEmpleado> CreateAsync(TEmpleado empleado)
        {
            _context.TEmpleados.Add(empleado);
            await _context.SaveChangesAsync();
            return empleado;
        }

        public async Task<TEmpleado?> UpdateAsync(long id, TEmpleado empleado)
        {
            var existing = await _context.TEmpleados.FindAsync(id);
            if (existing == null) return null;

            existing.IdEmpleado = empleado.IdEmpleado;
            existing.Nombre = empleado.Nombre;
            existing.Apellido = empleado.Apellido;

            await _context.SaveChangesAsync();
            return existing;
        }

       
    }
}