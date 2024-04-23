@isTest
public with sharing class RecentRecordsControllerTest {

    @isTest
    static void testGetRecentRecordsValid() {
        Account testAccount = new Account(Name='Test Account');
        insert testAccount;
        
        List<String> columns = new List<String>{'Id', 'Name'};
        String objectName = 'Account';

        Test.startTest();
        List<RecentRecordsController.RecordAccess> records = RecentRecordsController.getRecentRecords(objectName, columns, 1);
        Test.stopTest();

        System.assertEquals(1, records.size(), 'Should return exactly one record.');
        System.assertEquals(testAccount.Id, records[0].record.Id, 'The record ID should match the test account.');
        System.assertNotEquals(null, records[0].canEdit, 'Edit access should be determined.');
    }

    @isTest
    static void testGetRecentRecordsEmptyList() {
        List<String> columns = new List<String>{'Id'};
        String objectName = 'Order';

        Test.startTest();
        List<RecentRecordsController.RecordAccess> records = RecentRecordsController.getRecentRecords(objectName, columns, 1);
        Test.stopTest();

        System.assertEquals(0, records.size(), 'Should return empty list');
    }

    @isTest
    static void testGetRecentRecordsInvalidParameters() {
        String objectName = 'Account';
        List<String> columns = new List<String>();

        Test.startTest();
        try {
            RecentRecordsController.getRecentRecords(objectName, new List<String>(), null);
            System.assert(false, 'Method should have thrown an IllegalArgumentException.');
        } catch (AuraHandledException e) {
            System.assert(true, 'invalid argument exception.');
        }
        Test.stopTest();
    }

    @isTest
    static void testGetRecentRecordsInvalidParameters2() {
        String objectName = 'Account';
        List<String> columns = new List<String>();

        Test.startTest();
        try {
            RecentRecordsController.getRecentRecords(objectName, new List<String>{'a'}, 0);
            System.assert(false, 'Method should have thrown an IllegalArgumentException.');
        } catch (AuraHandledException e) {
            System.assert(true, 'invalid argument exception. number of records should be greater than 0;');
        }
        Test.stopTest();
    }

    @isTest
    static void testGetRecentRecordsInaccessibleObject() {
        String objectName = 'Name';
        List<String> columns = new List<String>{'Id', 'Title'};
        
        Test.startTest();
        try {
            RecentRecordsController.getRecentRecords(objectName, columns, 1);
            System.assert(false, 'Method should have thrown an IllegalArgumentException.');
        } catch (AuraHandledException e) {
            System.assert(true, 'accessibility exception.');
        }
        Test.stopTest();
    }

    @isTest
    static void testGetAccessibleObjects() {
        List<Map<String, String>> accessibleObjects = RecentRecordsController.getAccessibleObjects();
        Map<String, String> accessibleMap = new Map<String, String>();
        for (Map<String, String> objInfo : accessibleObjects) {
            accessibleMap.put(objInfo.get('value'), objInfo.get('label'));
        }
        System.assert(accessibleMap.containsKey('Account'), 'Account should be in the list of accessible objects');
        System.assert(!accessibleMap.containsKey('Name'), 'Account should be in the list of accessible objects');
    }

    @isTest
    static void testGetFieldsByEntity() {
        String entityName = 'Account';
        Test.startTest();
        List<Map<String, String>> fields = RecentRecordsController.getFieldsByEntity(entityName);
        Test.stopTest();
        Boolean nameFieldFound = false;
        Boolean billingCityFound = false;
        for (Map<String, String> field : fields) {
            if (field.get('value') == 'Name') {
                nameFieldFound = true;
                System.assertEquals('Account Name', field.get('label'), 'Label for Name field should be correct.');
            }
            if (field.get('value') == 'BillingCity') {
                billingCityFound = true;
                System.assertEquals('Billing City', field.get('label'), 'Label for BillingCity should be correct.');
            }
        }
        System.assert(nameFieldFound, 'Name field should be found in the Account object fields.');
        System.assert(billingCityFound, 'BillingCity field should be found in the Account object fields.');
    }

    @isTest
    static void testGetFieldDetailsWithValidObject() {
        String objectName = 'Account';
        Test.startTest();
        List<RecentRecordsController.FieldData> result = RecentRecordsController.getFieldDetails(objectName);
        Test.stopTest();
        System.assertNotEquals(null, result, 'The result should not be null.');
        System.assert(result.size() > 0, 'Should return at least one field.');
        Boolean foundNameField = false;
        for (RecentRecordsController.FieldData fd : result) {
            if (fd.value == 'name' && fd.label == 'Account Name' && !fd.isRelated) {
                foundNameField = true;
            }
        }
        System.assert(foundNameField, 'Field "name" should be in the results.');
    }

    @isTest
    static void testGetFieldsByNonexistentEntity() {
        String entityName = 'NonexistentObject';
        Test.startTest();
        try {
            RecentRecordsController.getFieldsByEntity(entityName);
            System.assert(false, 'Method should have thrown an exception for a non-existent object.');
        } catch (AuraHandledException e) {
            System.assert(true, 'Expected an exception because object is not valid');
        }
        Test.stopTest();
    }
}