@isTest
public with sharing class UserInfoControllerTest {
    
    private static User createTestUser(String profileName) {
        Profile p = [SELECT Id FROM Profile WHERE Name = :profileName LIMIT 1];
        User testUser = new User(
            Username = 'testuser_' + DateTime.now().getTime() + '@test.com',
            Email = 'testuser@test.com',
            LastName = 'Test',
            Alias = 'tuser',
            ProfileId = p.Id,
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            TimeZoneSidKey = 'America/Los_Angeles'
        );
        return testUser;
    }

    @isTest
    static void testIsSystemAdminTrue() {
        User adminUser = createTestUser('System Administrator');
        System.runAs(adminUser) {
            Map<String, Boolean> result = UserInfoController.isSystemAdmin();
            System.assertEquals(true, result.get('isAdmin'), 'The user should be recognized as an admin.');
        }
    }

    @isTest
    static void testIsSystemAdminFalse() {
        User nonAdminUser = createTestUser('Standard User');
        System.runAs(nonAdminUser) {
            Map<String, Boolean> result = UserInfoController.isSystemAdmin();
            System.assertEquals(false, result.get('isAdmin'), 'The user should not be recognized as an admin.');
        }
    }
}