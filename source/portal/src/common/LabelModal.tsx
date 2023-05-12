import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Box,
  SpaceBetween,
  Table,
  Header,
  FormField,
  Input,
  Pagination,
  CollectionPreferences,
  TextFilter,
} from '@cloudscape-design/components';
import {
  requestCreateLabel,
  requestDeleteLabel,
  requestGetAllLabels,
  requestUpdateLabel,
} from 'apis/label/api';
import { Label } from 'ts/data-catalog/types';

export interface LabelModalProps {
  showModal: boolean;
  defaultSelectLabels: Label[];
  clickHideModal: () => void;
  saveLoading: boolean;
  saveLabelToResource: (labelIds: Label[]) => void;
  addButtonText?: string;
}

const LabelModal: React.FC<LabelModalProps> = (props: LabelModalProps) => {
  const {
    showModal,
    defaultSelectLabels,
    clickHideModal,
    saveLabelToResource,
    saveLoading,
    addButtonText,
  } = props;
  const [showCreateLabel, setShowCreateLabel] = useState(false);

  const [allLabelList, setAllLabelList] = useState<Label[]>([]);
  const [curPage, setCurPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchLabelName, setSearchLabelName] = useState('');
  const [loadingLabel, setLoadingLabel] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  // const [newLabelName, setNewLabelName] = useState('');
  const [createOrUpdate, setCreateOrUpdate] = useState('create');
  const [currentLabel, setCurrentLabel] = useState<Label>({
    id: '',
    label_name: '',
  });
  const [selectedItems, setSelectedItems] = useState<Label[]>(
    defaultSelectLabels || []
  );
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tableDisplayData, setTableDisplayData] = useState<Label[]>([]);

  const getLabelsList = async () => {
    try {
      setLoadingLabel(true);
      const result: Label[] = await requestGetAllLabels({
        label_name: searchLabelName,
      });
      setLoadingLabel(false);
      if (result) {
        setAllLabelList(result);
        // set default selected items
        if (defaultSelectLabels.length > 0) {
          const defaultIds = defaultSelectLabels.map((item) => item.id);
          setSelectedItems(result.filter((e) => defaultIds.includes(e.id)));
        }
        setTotalCount(result.length);
        const start = (curPage - 1) * pageSize;
        setTableDisplayData(result.slice(start, start + pageSize));
      } else {
        setAllLabelList([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const createlabel = async () => {
    try {
      setLoadingUpdate(true);
      const result: Label = await requestCreateLabel({
        label_name: currentLabel.label_name,
      });
      setLoadingUpdate(false);
      if (result.label_name) {
        setCurrentLabel({
          id: '',
          label_name: '',
        });
        getLabelsList();
        setShowCreateLabel(false);
      }
    } catch (error) {
      setLoadingUpdate(false);
    }
  };

  const updatelabel = async () => {
    try {
      setLoadingUpdate(true);
      const result: Label = await requestUpdateLabel(currentLabel);
      setLoadingUpdate(false);
      if (result) {
        getLabelsList();
        setShowCreateLabel(false);
      }
    } catch (error) {
      setLoadingUpdate(false);
    }
  };

  const deleteLabel = async () => {
    try {
      setLoadingDelete(true);
      const result: boolean = await requestDeleteLabel({
        ids: selectedItems.map((e) => e.id).join(','),
      });
      setLoadingDelete(false);
      if (result) {
        setSelectedItems([]);
        setShowDeleteModal(false);
        getLabelsList();
      }
    } catch (error) {
      setLoadingDelete(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      getLabelsList();
    }
  }, [showModal]);

  useEffect(() => {
    const start = (curPage - 1) * pageSize;
    setTableDisplayData(allLabelList.slice(start, start + pageSize));
  }, [curPage, pageSize]);

  useEffect(() => {
    const start = 1;
    const afterFilterList = allLabelList.filter(
      (element) => element.label_name.indexOf(searchLabelName) >= 0
    );
    setTableDisplayData(afterFilterList.slice(start, start + pageSize));
    setTotalCount(afterFilterList.length);
  }, [searchLabelName]);

  return (
    <div>
      <Modal
        onDismiss={() => clickHideModal()}
        visible={showModal}
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  clickHideModal();
                }}
              >
                Cancel
              </Button>
              <Button
                loading={saveLoading}
                variant="primary"
                onClick={() => {
                  saveLabelToResource(selectedItems);
                }}
              >
                {addButtonText || 'Add to catalog'}
              </Button>
            </SpaceBetween>
          </Box>
        }
        header="Custom label"
      >
        <Table
          selectionType="multi"
          columnDefinitions={[
            {
              id: 'label',
              header: 'label',
              cell: (item: Label) => item.label_name || '-',
              sortingField: 'label_name',
              // isRowHeader: true,
            },
          ]}
          selectedItems={selectedItems}
          onSelectionChange={(e) => {
            if (e.detail.selectedItems.length === 1) {
              setCurrentLabel(e.detail.selectedItems[0]);
            }
            setSelectedItems(e.detail.selectedItems);
          }}
          items={tableDisplayData}
          loading={loadingLabel}
          loadingText="Loading labels"
          sortingDisabled
          variant="embedded"
          empty={
            <Box textAlign="center" color="inherit">
              <div>
                <p>No labels</p>
              </div>
              <Button
                onClick={() => {
                  setShowCreateLabel(true);
                }}
              >
                Create label
              </Button>
            </Box>
          }
          header={
            <Header
              counter="(50)"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    loading={loadingDelete}
                    disabled={selectedItems.length <= 0}
                    onClick={() => {
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    disabled={selectedItems.length !== 1}
                    onClick={() => {
                      setCreateOrUpdate('update');
                      setShowCreateLabel(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    iconName="add-plus"
                    onClick={() => {
                      setCreateOrUpdate('create');
                      setCurrentLabel({
                        id: '',
                        label_name: '',
                      });
                      setShowCreateLabel(true);
                    }}
                  >
                    Create
                  </Button>
                </SpaceBetween>
              }
            >
              Labels
            </Header>
          }
          filter={
            <TextFilter
              onChange={(e) => {
                setSearchLabelName(e.detail.filteringText);
              }}
              filteringPlaceholder="Find labels"
              filteringText={searchLabelName}
            />
          }
          preferences={
            <CollectionPreferences
              title="Preferences"
              confirmLabel="Confirm"
              cancelLabel="Cancel"
              preferences={{
                pageSize: pageSize,
              }}
              pageSizePreference={{
                title: 'Page size',
                options: [
                  { value: 10, label: '10 labels' },
                  { value: 20, label: '20 labels' },
                  { value: 50, label: '50 labels' },
                  { value: 100, label: '100 labels' },
                ],
              }}
              onConfirm={(e) => {
                setCurPage(1);
                setPageSize(e.detail.pageSize || 10);
              }}
            />
          }
          pagination={
            <Pagination
              currentPageIndex={curPage}
              pagesCount={Math.ceil(totalCount / pageSize)}
              onChange={(e) => {
                setCurPage(e.detail.currentPageIndex);
              }}
            />
          }
        />
      </Modal>

      <Modal
        size="small"
        onDismiss={() => setShowCreateLabel(false)}
        visible={showCreateLabel}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreateLabel(false);
                }}
              >
                Cancel
              </Button>
              <Button
                loading={loadingUpdate}
                variant="primary"
                onClick={() => {
                  if (createOrUpdate === 'create') {
                    createlabel();
                  } else {
                    updatelabel();
                  }
                }}
              >
                {createOrUpdate === 'create' ? 'Create' : 'Update'}
              </Button>
            </SpaceBetween>
          </Box>
        }
        header={createOrUpdate === 'create' ? 'Create Label' : 'Update Label'}
      >
        <FormField>
          <Input
            value={currentLabel?.label_name || ''}
            onChange={(e) => {
              setCurrentLabel((prev) => {
                return {
                  ...prev,
                  label_name: e.detail.value,
                };
              });
            }}
          />
        </FormField>
      </Modal>

      <Modal
        onDismiss={() => setShowDeleteModal(false)}
        visible={showDeleteModal}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowDeleteModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                loading={loadingDelete}
                variant="primary"
                onClick={() => {
                  deleteLabel();
                }}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
        header="Delete Label"
      >
        <FormField>
          Are you sure you want to delete label(s){' '}
          <b>{selectedItems.map((element) => element.label_name).join(', ')}</b>
          .
        </FormField>
      </Modal>
    </div>
  );
};

export default LabelModal;
