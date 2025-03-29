/**
 * @description       : 
 * @author            : Nihal Jha
 * @group             : 
 * @last modified on  : 04-12-2024
 * @last modified by  : Nihal Jha
**/
public with sharing class RecentRecordsController {

    public class RecordAccess {
        @AuraEnabled
        public sObject record {get; set;}
        @AuraEnabled
        public Boolean canEdit {get; set;}

        public RecordAccess(sObject record, Boolean canEdit) {
            this.record = record;
            this.canEdit = canEdit;
        }
    }

    public class FieldData {
        @AuraEnabled
        public String label {get; set;}
        @AuraEnabled
        public String value {get; set;}
        @AuraEnabled
        public Boolean isRelated {get; set;}
        public FieldData(String label, String value, Boolean isRelated) {
            this.label = label;
            this.value = value;
            this.isRelated = isRelated;
        }
    }


    @AuraEnabled(cacheable=true)
    public static List<RecordAccess> getRecentRecords(String objectName, List<String> columns ,Integer numberOfRecords) {
        try {
            if (String.isEmpty(objectName) || numberOfRecords == null || columns.isEmpty()) {
                throw new IllegalArgumentException(System.Label.RR_Invalid_Parameters_Error_Msg);
            }
            System.debug(numberOfRecords);
            System.debug(numberOfRecords <= 0);

            if (numberOfRecords <= 0) {
                throw new IllegalArgumentException(System.Label.RR_No_Of_Record_Error_Msg);
            }
            Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
            if (!globalDescribe.containsKey(objectName) ||
                !globalDescribe.get(objectName).getDescribe().isAccessible() ||
                !globalDescribe.get(objectName).getDescribe().isQueryable()) {
                    throw new IllegalArgumentException(String.format(System.Label.RR_Object_Security_Error_Msg, new List<Object>{objectName}));
            }
            List<String> fieldList = new List<String>(globalDescribe.get(objectName).getDescribe().fields.getMap().keySet());
            string orderBy = fieldList.contains(System.Label.RR_createddate) ? System.Label.RR_Order_By_CreatedDate : fieldList.contains(System.Label.RR_lastmodifieddate) ? System.Label.RR_Order_By_LastModifiedDate : '';
            // String queryTemplate = 'SELECT {0} FROM {1} {2} LIMIT :numberOfRecords';
            String queryTemplate = System.Label.RR_GetRecentRecords_Query_Template;
            List<SObject> results;
        
            results = (List<SObject>)Security.stripInaccessible(
                AccessType.READABLE, Database.query(
                    String.format(queryTemplate, new List<Object>{String.join(columns, ', '), objectName, orderBy})
                    )
            ).getRecords();
            if(results.isEmpty()) {
                return new List<RecordAccess>();
            }
            Set<Id> recordIdSet = createIdSet(results);
            List<UserRecordAccess> userRecordAccessList = Security.stripInaccessible(
                AccessType.READABLE, 
                [SELECT RecordId, HasEditAccess FROM UserRecordAccess WHERE UserId = :UserInfo.getUserId() AND RecordId IN :recordIdSet]
                ).getRecords();

            return addEditAccessField(results, userRecordAccessList);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getAccessibleObjects() {
        try{
            List<Map<String, String>> accessibleObjects = new List<Map<String, String>>();
            Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
            
            for (String objectName : globalDescribe.keySet()) {
                Schema.SObjectType sObjType = globalDescribe.get(objectName);
                Schema.DescribeSObjectResult describeSObj = sObjType.getDescribe();
            
                if (describeSObj.isAccessible() && describeSObj.isQueryable()) {
                    Map<String, String> objInfo = new Map<String, String>();
                    objInfo.put('label', describeSObj.getLabel());
                    objInfo.put('value', describeSObj.getName());
                    accessibleObjects.add(objInfo);
                }
            }
            return accessibleObjects;
        }
        catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String,String>> getFieldsByEntity(String entityName) {
        try{
            List<Map<String,String>> fieldOptions = new List<Map<String,String>>();
            Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(entityName).getDescribe();
            Map<String, Schema.SObjectField> fieldsMap = objDescribe.fields.getMap();
            for (String fieldName : fieldsMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(fieldName).getDescribe();
                Map<String,String> option = new Map<String,String>();
                option.put('value', fieldName);
                option.put('label', fieldDescribe.getLabel());
                fieldOptions.add(option);
            }
            return fieldOptions;
        }
        catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    @AuraEnabled(cacheable=true)
    public static List<FieldData> getFieldDetails(String objectName) {
        try{
            List<FieldData> fields = new List<FieldData>();
    
            Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
            Schema.SObjectType sObjType = globalDescribe.get(objectName);
            if (sObjType != null) {
                Schema.DescribeSObjectResult sObjectDescribe = sObjType.getDescribe();
                Map<String, Schema.SObjectField> fieldMap = sObjectDescribe.fields.getMap();
                for (String fieldName : fieldMap.keySet()) {
                    Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                    fields.addAll(createFieldList(fieldDescribe));
                    fields.add(new FieldData(fieldDescribe.getLabel(), fieldName, false));
                }
            }
            return fields;
        }
        catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        
    }

    private static List<FieldData> createFieldList(Schema.DescribeFieldResult fieldDescribe) {
        List<FieldData> fields = new List<FieldData>();
        if (fieldDescribe.getType() == Schema.DisplayType.Reference) {
            List<Schema.SObjectType> refTypes = fieldDescribe.getReferenceTo();
            if (!refTypes.isEmpty()) {
                String relationshipName = fieldDescribe.getRelationshipName();
                if (relationshipName != null) {
                    fields.add(new FieldData(refTypes[0].getDescribe().getName(), relationshipName, true));
                }
            }
        }
        return fields;
    }


    private static Set<Id> createIdSet(List<SObject> records) {
        Set<Id> recordIds = new Set<Id>();
        for(SObject record : records) {
            recordIds.add(record.Id);
        }
        return recordIds;
    }

    private static List<RecordAccess> addEditAccessField(List<SObject> records, List<UserRecordAccess> userRecordAccessList) {
        List<RecordAccess> accessRecords = new List<RecordAccess>();
        Map<Id, Boolean> editAccessMap = new Map<Id, Boolean>();
        for (UserRecordAccess ura : userRecordAccessList) {
            editAccessMap.put(ura.RecordId, ura.HasEditAccess);
        }
        for (sObject record : records) {
            Boolean canEdit = editAccessMap.containsKey(record.Id) ? editAccessMap.get(record.Id) : false;
            accessRecords.add(new RecordAccess(record, canEdit));
        }
        return accessRecords;
    }

}