using Reservas_Salas.Server.DTOs;
using Reservas_Salas.Server.Models;

namespace Reservas_Salas.Server.Services.Interfaces
{
    public interface ITReservaService
    {
        Task<IEnumerable<TReserva>> GetAllAsync();
        Task<TReserva?> GetByIdAsync(long id);
        Task<List<ReservaEmpleadoDTO>> GetByEmployeeIdAsync(long id);
        Task<TReserva> CreateAsync(TReserva reserva);
        Task<IEnumerable<TReserva>> GetReservasPorSalaYFechaAsync(long idSala, DateTime fecha);
        Task<TReserva?> UpdateAsync(TReserva reserva);
    }
}
