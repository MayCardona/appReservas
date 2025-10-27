using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Reservas_Salas.Server.Models;

[Table("T_Empleados")]
public partial class TEmpleado
{
    [Key]
    public long IdEmpleado { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string Nombre { get; set; } = null!;

    [StringLength(100)]
    [Unicode(false)]
    public string Apellido { get; set; } = null!;

    public DateOnly? FechaIngreso { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string? Salario { get; set; }

    [StringLength(200)]
    [Unicode(false)]
    public string? Email { get; set; }

    public long? Celular { get; set; }

    public int Cargo { get; set; }

    public int Empresa { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string? TipoContrato { get; set; }
    public bool? Activo { get; set; }

    public int? Extension { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string? Direccion { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string? Ciudad { get; set; }

    public long? IdEquipo { get; set; }

    [ForeignKey("Cargo")]
    [InverseProperty("TEmpleados")]
    public virtual TCargo CargoNavigation { get; set; } = null!;

    [ForeignKey("Empresa")]
    [InverseProperty("TEmpleados")]
    public virtual TTipoEmpresa EmpresaNavigation { get; set; } = null!;



    [InverseProperty("IdEmpleadoNavigation")]
    public virtual ICollection<TReserva> TReservas { get; set; } = new List<TReserva>();
}



