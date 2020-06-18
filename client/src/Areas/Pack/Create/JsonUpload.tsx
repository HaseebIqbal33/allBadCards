import React, { createRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  DialogActions,
  DialogContent,
  IconButton,
  Link,
} from "@material-ui/core";
import { FaRegQuestionCircle, FaUpload } from "react-icons/all";
import { CloseableDialog } from "../../../UI/CloseableDialog";
import { ErrorDataStore } from "../../../Global/DataStore/ErrorDataStore";
import { AbcPackSchema, validatePackInput } from "./schema";
import {
  PackCreatorDataStore,
  PackCreatorDataStorePayload,
} from "../../../Global/DataStore/PackCreatorDataStore";
import { BrowserUtils } from "../../../Global/Utils/BrowserUtils";
import { selectElementText } from "../../../Global/Utils/DomUtils";

export const JsonUpload: React.FC = () => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);

  const addInputRef = createRef<HTMLInputElement>();
  const replaceInputRef = createRef<HTMLInputElement>();
  const preRef = createRef<HTMLPreElement>();

  const addClick = () => {
    addInputRef.current?.click();
  };

  const replaceClick = () => {
    replaceInputRef.current?.click();
  };

  const clearInput = () => {
    if (addInputRef.current) {
      addInputRef.current.value = "";
    }

    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
    }
  };

  const onFileSelected = (
    e: React.ChangeEvent<HTMLInputElement>,
    replace = true
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const p = new Promise<string | ArrayBuffer>((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.addEventListener("load", (e) => {
            const result = e.target?.result;
            if (result) {
              resolve(result);
            }
          });
          reader.readAsText(file);
        } catch (e) {
          reject(e);
        }
      });

      p.then((data) => validate(data, replace)).catch(ErrorDataStore.add);

      setDisclaimerOpen(false);
    }
  };

  const validate = (result: string | ArrayBuffer, replace: boolean) => {
    const stringResult = result.toString();
    let obj: any;
    try {
      obj = JSON.parse(stringResult);
    } catch (e) {
      ErrorDataStore.add(new Error("This file isn't valid JSON."));
      clearInput();
      return;
    }

    try {
      const validateResult = validatePackInput(obj);
      if (validateResult.valid) {
        const pack = obj as PackCreatorDataStorePayload;
        PackCreatorDataStore.hydrateFromData(pack, replace);

        setTimeout(BrowserUtils.scrollToTop, 250);
      } else {
        validateResult.errors.forEach((e) => {
          ErrorDataStore.add(new Error(e.stack));
        });
      }
    } catch (e) {
      ErrorDataStore.add(e);
    }

    clearInput();
  };

  return (
    <div>
      <Button
        startIcon={<FaUpload />}
        variant={"outlined"}
        onClick={() => setDisclaimerOpen(true)}
      >
        Import from JSON
      </Button>
      <IconButton onClick={() => setHelpOpen(true)}>
        <FaRegQuestionCircle />
      </IconButton>
      <CloseableDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        TitleProps={{ children: "What is 'Add from JSON'?" }}
      >
        <DialogContent>
          Instead of using the Kafuckle tools to create a card pack, you can
          also do it manually using text files.
        </DialogContent>
      </CloseableDialog>
      <CloseableDialog
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        TitleProps={{ children: "Add or Replace?" }}
      >
        <DialogContent dividers>
          You can choose to replace this pack's cards (if there are any), or add
          to them. Which would you like to do?
          <br />
          <br />
          <input
            accept="application/json"
            hidden
            id="add-button-file"
            type="file"
            ref={addInputRef}
            onChange={(e) => onFileSelected(e, false)}
          />
          <input
            accept="application/json"
            hidden
            id="replace-button-file"
            type="file"
            ref={replaceInputRef}
            onChange={(e) => onFileSelected(e, true)}
          />
          <Link
            component="button"
            onClick={() => setSchemaOpen(true)}
            color={"secondary"}
          >
            View JSON Schema
          </Link>
        </DialogContent>
        <DialogActions>
          <ButtonGroup>
            <Button variant={"text"} onClick={addClick} color={"secondary"}>
              Add to Pack
            </Button>
            <Button variant={"text"} onClick={replaceClick} color={"secondary"}>
              Replace Pack
            </Button>
          </ButtonGroup>
        </DialogActions>
      </CloseableDialog>
      <CloseableDialog
        open={schemaOpen}
        onClose={() => setSchemaOpen(false)}
        TitleProps={{ children: "Card Pack JSON Schema" }}
        maxWidth={"lg"}
      >
        <DialogContent dividers>
          <pre onClick={() => selectElementText(preRef.current)} ref={preRef}>
            {JSON.stringify(AbcPackSchema, null, 2)}
          </pre>
        </DialogContent>
      </CloseableDialog>
    </div>
  );
};
