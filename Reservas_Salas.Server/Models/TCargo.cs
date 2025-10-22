using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Reservas_Salas.Server.Models;

[Table("T_Cargos")]
public partial class TCargo
{
    [Key]
    public int IdCargo { get; set; }

    [StringLength(200)]
    [Unicode(false)]
    public string? Cargo { get; set; }

    public int IdArea { get; set; }

    [JsonIgnore]
    [InverseProperty("CargoNavigation")]
    public virtual ICollection<TEmpleado> TEmpleados { get; set; } = new List<TEmpleado>();
}
