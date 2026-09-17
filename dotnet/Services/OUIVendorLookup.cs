using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace HomePulse.Services;

public interface IOUIVendorLookup
{
    string LookupVendor(string macAddress);
    void RegisterVendorPrefix(string prefix, string vendorName);
}

public class OUIVendorLookup : IOUIVendorLookup
{
    private static readonly Regex MacSanitizer = new(@"[^a-fA-F0-9]", RegexOptions.Compiled);

    // Dictionary of uppercase 6-character hex prefixes (OUI 24-bit block)
    private readonly ConcurrentDictionary<string, string> _ouiTable = new(StringComparer.OrdinalIgnoreCase);

    public OUIVendorLookup()
    {
        SeedCommonVendors();
    }

    public string LookupVendor(string macAddress)
    {
        if (string.IsNullOrWhiteSpace(macAddress))
            return "Unknown Device";

        var sanitized = MacSanitizer.Replace(macAddress, "").ToUpperInvariant();
        if (sanitized.Length < 6)
            return "Unknown Device";

        var prefix = sanitized[..6];

        if (_ouiTable.TryGetValue(prefix, out var vendor))
        {
            return vendor;
        }

        // Check for locally administered addresses (bit 1 of byte 0 set)
        if (IsLocallyAdministered(sanitized))
        {
            return "Private/Randomized MAC (Virtual or Mobile Device)";
        }

        return "Generic Network Interface";
    }

    public void RegisterVendorPrefix(string prefix, string vendorName)
    {
        var sanitized = MacSanitizer.Replace(prefix, "").ToUpperInvariant();
        if (sanitized.Length >= 6)
        {
            _ouiTable[sanitized[..6]] = vendorName;
        }
    }

    private static bool IsLocallyAdministered(string sanitizedMac)
    {
        if (sanitizedMac.Length < 2) return false;
        if (int.TryParse(sanitizedMac[..2], System.Globalization.NumberStyles.HexNumber, null, out var firstByte))
        {
            return (firstByte & 0x02) != 0;
        }
        return false;
    }

    private void SeedCommonVendors()
    {
        var vendors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // Ubiquiti Networks
            ["245A4C"] = "Ubiquiti Inc.",
            ["0418D6"] = "Ubiquiti Inc.",
            ["68D79A"] = "Ubiquiti Inc.",
            ["74ACB9"] = "Ubiquiti Inc.",
            ["802AA8"] = "Ubiquiti Inc.",
            ["F09FC2"] = "Ubiquiti Inc.",
            ["B4FBE4"] = "Ubiquiti Inc.",

            // Synology
            ["001132"] = "Synology Incorporated",

            // Raspberry Pi
            ["B827EB"] = "Raspberry Pi Foundation",
            ["DC2632"] = "Raspberry Pi Trading Ltd",
            ["E45F01"] = "Raspberry Pi Trading Ltd",
            ["28CDC1"] = "Raspberry Pi Trading Ltd",

            // Apple
            ["ACDE48"] = "Apple Inc.",
            ["F4F15A"] = "Apple Inc.",
            ["BC6C21"] = "Apple Inc.",
            ["149877"] = "Apple Inc.",
            ["3C15C2"] = "Apple Inc.",
            ["F01898"] = "Apple Inc.",
            ["A483E7"] = "Apple Inc.",
            ["38F9D3"] = "Apple Inc.",

            // Espressif (ESP8266 / ESP32 smart home IoT)
            ["240AC4"] = "Espressif Systems",
            ["30AEA4"] = "Espressif Systems",
            ["84CCA8"] = "Espressif Systems",
            ["A020A6"] = "Espressif Systems",
            ["CC50E3"] = "Espressif Systems",

            // Philips Hue (Signify)
            ["001788"] = "Signify Netherlands B.V. (Philips Hue)",
            ["ECB5FA"] = "Signify Netherlands B.V. (Philips Hue)",

            // Google / Nest
            ["001A11"] = "Google LLC",
            ["182666"] = "Google LLC",
            ["546009"] = "Google LLC",
            ["641666"] = "Google LLC",
            ["A47733"] = "Google Nest",

            // Amazon
            ["40B4CD"] = "Amazon Technologies Inc.",
            ["6837E9"] = "Amazon Technologies Inc.",
            ["74C246"] = "Amazon Technologies Inc.",
            ["F0F002"] = "Amazon Technologies Inc.",

            // Intel
            ["001B21"] = "Intel Corporate",
            ["001500"] = "Intel Corporate",
            ["A44CC8"] = "Intel Corporate",

            // Cisco
            ["00000C"] = "Cisco Systems Inc.",
            ["000142"] = "Cisco Systems Inc.",
            ["004096"] = "Cisco Systems Inc.",

            // TP-Link
            ["50C7BF"] = "TP-Link Corporation",
            ["EC086B"] = "TP-Link Corporation",
            ["6032B1"] = "TP-Link Corporation",

            // Sonos
            ["000E58"] = "Sonos Inc.",
            ["48A6B8"] = "Sonos Inc.",
            ["5C313E"] = "Sonos Inc.",

            // Samsung
            ["A87C01"] = "Samsung Electronics",
            ["CC07AB"] = "Samsung Electronics",
            ["E47CF9"] = "Samsung Electronics",

            // LG Electronics
            ["10F9EE"] = "LG Electronics",
            ["58A2B5"] = "LG Electronics"
        };

        foreach (var (prefix, name) in vendors)
        {
            _ouiTable[prefix] = name;
        }
    }
}
