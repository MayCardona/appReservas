using Microsoft.EntityFrameworkCore;
using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;

namespace Reservas_Salas.Server.Services.Implementations
{
    public class TSalaService : ITSalaService
    {
        private readonly AppDbContext _context;

        public TSalaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TSala>> GetAllAsync()
        {
            return await _context.TSalas.ToListAsync();
        }

        public async Task<TSala?> GetByIdAsync(long id)
        {
            return await _context.TSalas.FindAsync(id);
        }

        public async Task<TSala> CreateAsync(TSala sala)
        {
            _context.TSalas.Add(sala);
            await _context.SaveChangesAsync();
            return sala;
        }

        public async Task<TSala?> UpdateAsync( TSala sala)
        {
            var existing = await _context.TSalas.FindAsync(sala.IdSala);
            if (existing == null) return null;

          
            existing.Reservado = sala.Reservado;

            await _context.SaveChangesAsync();
            return existing;
        }

        
    }
}