namespace Reservas_Salas.Server.Services.Interfaces
{
    public interface IOtpService
    {
        Task<string>GenerateOtpAsync(long IdEmpleado);
        Task<bool>ValidateOtpAsync(long IdEmpleado,string CodeOtp);
        Task<object> BringEmployeeInfoAsync(long IdEmpleado);
        
    }
}
