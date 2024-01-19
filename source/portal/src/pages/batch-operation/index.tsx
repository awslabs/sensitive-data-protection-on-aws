import { Button, FileUpload, Flashbar, FormField } from "@cloudscape-design/components";
import React, { useState } from "react";
import { batchCreateDatasource } from 'apis/data-source/api';

const BatchOperation = ()=>{
    const [value, setValue] = useState([] as any);
    const [errors, setErrors] = useState([] as any);
    const [disable, setDisable] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = React.useState([
        {
          type: "info",
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () => setItems([]),
          content: (
            <>
              This is an info flash message. It contains{" "}
              .
            </>
          ),
          id: "message_1"
        }
      ] as any);
    const [result, setResult] = useState("OK")
    const changeFile=(file:any)=>{
        if(file[0].name.endsWith(".xlsx")===true){
            setErrors([])
            setDisable(false)
        } else {
            setErrors(["Uploaded file must have an xlsx extension."])
        }
        setValue(file)
    }

    const batchCreate = async () => {
        setIsLoading(true);
        const result: any = await batchCreateDatasource({files: value});
        setIsLoading(false)
        if(result){
            setResult("OK")
        } else {
            setResult("NG")
        }
      };

  return (
    <>
    <FormField
      label="Form field label"
      description="Description"
    >
      <FileUpload
        onChange={({ detail}) => changeFile(detail.value)}
        value={value}
        i18nStrings={{
          uploadButtonText: e =>
            e ? "Choose files" : "Choose file",
          dropzoneText: e =>
            e
              ? "Drop files to upload"
              : "Drop file to upload",
          removeFileAriaLabel: e =>
            `Remove file ${e + 1}`,
          limitShowFewer: "Show fewer files",
          limitShowMore: "Show more files",
          errorIconAriaLabel: "Error"
        }}
        invalid
        fileErrors={errors}
        showFileLastModified
        showFileSize
        showFileThumbnail
        tokenLimit={3}
        constraintText="Hint text for file requirements"
      />
    </FormField>
    <Button onClick={batchCreate}  disabled={disable}>上传</Button>
    <Flashbar items={items} />
    </>
  );
}

export default BatchOperation