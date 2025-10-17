using Microsoft.EntityFrameworkCore;
using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.DTOs;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;

namespace Reservas_Salas.Server.Services.Implementations
{
    public class TReservaService : ITReservaService
    {
        private readonly AppDbContext _context;

        public TReservaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TReserva>> GetAllAsync()
        {
            return await _context.TReservas.ToListAsync();
        }

        public async Task<TReserva?> GetByIdAsync(long id)
        {
            var coso = await _context.TReservas.FindAsync(id);
            return coso;
        }
        public async Task<List<ReservaEmpleadoDTO>> GetByEmployeeIdAsync(long id)
        {
            return await _context.TReservas
                .Where(r => r.IdEmpleado == id)
                .Join(
                    _context.TSalas,
                    reserva => reserva.IdSala,
                    sala => sala.IdSala,
                    (reserva, sala) => new ReservaEmpleadoDTO
                    {
                        IdReserva = reserva.IdReserva,
                        FechaInicio = reserva.FechaInicio,
                        FechaFin = reserva.FechaFin,
                        IdSala = sala.IdSala,
                        NombreSala = sala.Salas, // <-- nombre del campo en tu tabla de salas
                        Estado = reserva.Estado
                    }
                )
                .OrderByDescending(r => r.FechaInicio)
                .ToListAsync();
        }


        public async Task<IEnumerable<TReserva>> GetReservasPorSalaYFechaAsync(long idSala, DateTime fecha)
        {
            return await _context.TReservas
                 .Where(r => r.IdSala == idSala && r.FechaInicio.Date == fecha.Date)
                 .OrderBy(r => r.FechaInicio)
                 .ToListAsync();
        }

        public async Task<TReserva> CreateAsync(TReserva reserva)
        {
            if (reserva == null)
                throw new ArgumentNullException(nameof(reserva));

            // Si la fecha fin no viene, asumimos que dura 1 hora
            if (reserva.FechaFin == default || reserva.FechaFin <= reserva.FechaInicio)
                reserva.FechaFin = reserva.FechaInicio.AddHours(1);

            var sala = await _context.TSalas.FindAsync(reserva.IdSala);
            if (sala == null)
                throw new InvalidOperationException("La sala especificada no existe.");

            // Comprobar solapamientos: misma sala y misma fecha (comparando por Date)
            var fechaReserva = reserva.FechaInicio.Date;

            bool hayConflicto = await _context.TReservas.AnyAsync(r =>
                r.IdSala == reserva.IdSala &&
                r.FechaInicio.Date == fechaReserva &&
                (
                    (reserva.FechaInicio >= r.FechaInicio && reserva.FechaInicio < r.FechaFin) ||
                    (reserva.FechaFin > r.FechaInicio && reserva.FechaFin <= r.FechaFin) ||
                    (reserva.FechaInicio <= r.FechaInicio && reserva.FechaFin >= r.FechaFin)
                )
            );

            if (hayConflicto)
                throw new InvalidOperationException("La sala no está disponible en el horario seleccionado.");

            _context.TReservas.Add(reserva);
            await _context.SaveChangesAsync();

            return reserva;
        }


        public async Task<TReserva?> UpdateAsync(TReserva reserva)
        {
            var existing = await _context.TReservas.FindAsync(reserva.IdReserva);
            if (existing == null) return null;

            existing.Estado = reserva.Estado;

            
            await _context.SaveChangesAsync();
            return existing;
        }
    }
}
