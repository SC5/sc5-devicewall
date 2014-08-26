# Build the image
build:
	docker build -t index.sc5.io/devicewall .

# Run locally
run:
	docker run -rm -t -i -p 49002:80 -v /data:/data --name devicewall index.sc5.io/devicewall

# Push the image from local computer to SC5 repository
push:
	docker push index.sc5.io/devicewall
