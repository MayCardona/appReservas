using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.DotNet.Scaffolding.Shared.Messaging;
using Reservas_Salas.Server.DTOs;
using Reservas_Salas.Server.Services.Interfaces;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Reservas_Salas.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IOtpService _otpService;

        public AuthController(IOtpService otpService)
        {
            _otpService = otpService;
        }

        

        // POST api/request-otp
        [HttpPost("request-otp")]
        public async Task<IActionResult> RequestOtp([FromBody] OtpRequestDTO dto)
        {
            try
            {
                await  _otpService.GenerateOtpAsync(dto.IdEmpleado);
                return Ok(new
                {
                    success = true,
                    Message = "OTP Enviado a correo asociado"
                    
                });
            }catch(Exception ex){
                return BadRequest(new
                {
                    success = false,
                    message = $"Error al enviar OTP: {ex.Message}"
                });
            }
        }

        // POST api/validate-otp
        [HttpPost("response-otp")]
        public async Task<IActionResult> ValitdateOtp([FromBody] OtpResponseDTO dto)
        {
            try
            {
                
                await _otpService.ValidateOtpAsync(dto.IdEmpleado,dto.OtpCode);
                return Ok(new
                {
                    success = true,
                    Message = "Codigo OTP validado correctamente"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("bring-info")]
        public async Task<IActionResult> BringEmployeeInfo([FromBody] OtpRequestDTO dto)
        {
            try
            {
                var EmployeeInfo= await _otpService.BringEmployeeInfoAsync(dto.IdEmpleado);
                return Ok(EmployeeInfo);
            }catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        // PUT api/<AuthController>/5
        //[HttpPut("{id}")]
        //public void Put(int id, [FromBody] string value)
        //{
        //}

        //// DELETE api/<AuthController>/5
        //[HttpDelete("{id}")]
        //public void Delete(int id)
        //{
        //}
    }
}
