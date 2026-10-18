Add-Type -AssemblyName System.Drawing

$srcPath = "d:\editing\coding\quiz\public\images\nattarivu-quiz-logo.png"
$src = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Source image size: $($src.Width) x $($src.Height)"

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$pad = 12
$availW = $size - ($pad * 2)
$availH = $size - ($pad * 2)

$aspect = [double]$src.Width / [double]$src.Height
$destW = $availW
$destH = [int]($destW / $aspect)
if ($destH -gt $availH) {
    $destH = $availH
    $destW = [int]($destH * $aspect)
}
$destX = [int](($size - $destW) / 2)
$destY = [int](($size - $destH) / 2)

$g.DrawImage($src, $destX, $destY, $destW, $destH)
$g.Dispose()

# Save PNG memory stream
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()

# Save as src/app/icon.png and public/images/nattarivu-favicon-256.png
$bmp.Save("d:\editing\coding\quiz\src\app\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("d:\editing\coding\quiz\public\images\nattarivu-favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Function to write ICO
function Write-IcoFile($outputPath, $pngData) {
    $fs = New-Object System.IO.FileStream($outputPath, [System.IO.FileMode]::Create)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # ICO header (6 bytes)
    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type (1=icon)
    $bw.Write([uint16]1) # Count (1 image)

    # Icon directory entry (16 bytes)
    $bw.Write([byte]0)   # Width (0 = 256)
    $bw.Write([byte]0)   # Height (0 = 256)
    $bw.Write([byte]0)   # Color count
    $bw.Write([byte]0)   # Reserved
    $bw.Write([uint16]1) # Color planes
    $bw.Write([uint16]32)# Bits per pixel
    $bw.Write([uint32]$pngData.Length) # Image size in bytes
    $bw.Write([uint32]22) # Image offset (6 + 16 = 22)

    # Write PNG bytes
    $bw.Write($pngData)

    $bw.Close()
    $fs.Close()
}

Write-IcoFile "d:\editing\coding\quiz\src\app\favicon.ico" $pngBytes
Write-IcoFile "d:\editing\coding\quiz\public\favicon.ico" $pngBytes

$src.Dispose()
$bmp.Dispose()

Write-Host "Favicons generated successfully. PNG length: $($pngBytes.Length)"
