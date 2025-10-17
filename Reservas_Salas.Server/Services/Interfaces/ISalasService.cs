using Reservas_Salas.Server.Models;

namespace Reservas_Salas.Server.Services.Interfaces
{
    public interface ITSalaService
    {
        Task<IEnumerable<TSala>> GetAllAsync();
        Task<TSala?> GetByIdAsync(long id);
        Task<TSala?> UpdateAsync(TSala sala);
    }
}