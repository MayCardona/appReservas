using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Reservas_Salas.Server.Models;

[Table("T_TipoEmpresa")]
public partial class TTipoEmpresa
{
    [Key]
    public int IdEmpresa { get; set; }

    [StringLength(60)]
    [Unicode(false)]
    public string Empresa { get; set; } = null!;

    [StringLength(50)]
    [Unicode(false)]
    public string? Nit { get; set; }

    [StringLength(200)]
    [Unicode(false)]
    public string? Direccion { get; set; }

    [InverseProperty("EmpresaNavigation")]
    public virtual ICollection<TEmpleado> TEmpleados { get; set; } = new List<TEmpleado>();
}
