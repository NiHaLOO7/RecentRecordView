public with sharing class RecordFieldHandler {

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
}