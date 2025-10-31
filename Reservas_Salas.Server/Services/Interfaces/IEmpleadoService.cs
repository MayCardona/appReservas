using Reservas_Salas.Server.Models;

namespace Reservas_Salas.Server.Services.Interfaces
{
    public interface ITEmpleadoService
    {
        Task<IEnumerable<TEmpleado>> GetAllAsync();
        Task<TEmpleado?> GetByIdAsync(long id);
        Task<TEmpleado?> GetByIdAndCargoAsync(long id);
        Task<TEmpleado?> UpdateAsync(long id, TEmpleado empleado);
    }
}
