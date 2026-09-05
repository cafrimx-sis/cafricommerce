public class RegistroDto
{
    public string Nombre { get; set; } = string.Empty;
    public string ApellidoPaterno { get; set; } = string.Empty;
    public string ApellidoMaterno { get; set; } = string.Empty;
    public DateTime FechaNacimiento { get; set; } // Obligatorio sin '?'
    public string Direccion { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string CodigoPostal { get; set; } = string.Empty;
    public string Colonia { get; set; } = string.Empty;
    public string CanalPreferido { get; set; } = "Email";
}

public class VerificarCodigoDto
{
    public string Email { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
}

public class OlvidePasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class RestablecerPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NuevoPassword { get; set; } = string.Empty;
}