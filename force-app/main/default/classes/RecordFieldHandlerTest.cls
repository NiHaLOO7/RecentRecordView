@isTest
public with sharing class RecordFieldHandlerTest {
    
    @isTest
    static void testGetFieldDetailsWithValidObject() {
        String objectName = 'Account';
        Test.startTest();
        List<RecordFieldHandler.FieldData> result = RecordFieldHandler.getFieldDetails(objectName);
        Test.stopTest();
        System.assertNotEquals(null, result, 'The result should not be null.');
        System.assert(result.size() > 0, 'Should return at least one field.');
        Boolean foundNameField = false;
        for (RecordFieldHandler.FieldData fd : result) {
            if (fd.value == 'name' && fd.label == 'Account Name' && !fd.isRelated) {
                foundNameField = true;
            }
        }
        System.assert(foundNameField, 'Field "name" should be in the results.');
    }
}