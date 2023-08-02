part_bytes = 100000

def concurrent_upload(bucket_name, object_name, file_path, client):
    multipart_upload_response = client.create_multipart_upload(Bucket=bucket_name, Key=object_name)
    upload_id = multipart_upload_response['UploadId']

    parts = []
    uploaded_bytes = 0
    with open(file_path, "rb") as f:
        i = 1
        while True:
            data = f.read(part_bytes)
            if not len(data):
                break
            part = client.upload_part(Body=data, Bucket=bucket_name, Key=object_name, UploadId=upload_id, PartNumber=i)
            parts.append({"PartNumber": i, "ETag": part["ETag"]})
            uploaded_bytes += len(data)
            i += 1

    client.complete_multipart_upload(Bucket=bucket_name, Key=object_name, UploadId=upload_id,
                                     MultipartUpload={"Parts": parts})
