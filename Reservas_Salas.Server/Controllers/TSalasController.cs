using Microsoft.AspNetCore.Mvc;
using Reservas_Salas.Server.DTOs;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;

namespace Reservas_Salas.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TSalasController : ControllerBase
    {
        private readonly ITSalaService _salaService;

        public TSalasController(ITSalaService salaService)
        {
            _salaService = salaService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var salas = await _salaService.GetAllAsync();
            return Ok(salas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var sala = await _salaService.GetByIdAsync(id);
            if (sala == null) return NotFound();
            return Ok(sala);
        }



        [HttpPut]

        public async Task<IActionResult> Update([FromBody] TSalaDTO dto)

        {

            if (!ModelState.IsValid)

                return BadRequest(ModelState);

            // Mapear DTO a entidad del modelo

            var sala = new TSala

            {

                IdSala = dto.IdSala,

                Reservado = dto.Reservado ?? 0 // en caso de que venga nulo

            };

            var updated = await _salaService.UpdateAsync(sala);

            if (updated == null) return NotFound();

            return Ok(updated);

        }



    }
}