$dttag = $(Get-Date -Format "yyyy-MMdd-HHmm").ToString()

docker build -t watermark-studio:$($dttag) .
docker tag watermark-studio:$($dttag) watermark-studio:latest
